import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  AuthError,
  authenticate,
  isDevAuthAllowed,
  normalizeTeamDomain,
  parseAllowedEmails,
  resetAuthCache,
  verifyAccessJwt,
} from '../worker/auth';
import type { Env } from '../worker/types';

const TEAM = 'https://myteam.cloudflareaccess.com';
const AUD = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
const NOW = 1_800_000_000_000; // ms
const SEC = NOW / 1000;

// ── helpers: real RSA keys and real RS256 signatures, like Cloudflare Access makes ──────

type KeyPair = { privateKey: CryptoKey; publicKey: CryptoKey };

async function makeKeys(): Promise<KeyPair> {
  return (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as KeyPair;
}

const keyA = await makeKeys(); // the real Access key (kid-a)
const keyB = await makeKeys(); // another key (kid-b, rotated in later) or an attacker's key

async function jwkOf(pair: KeyPair, kid: string) {
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { kty: 'RSA', kid, n: jwk.n, e: jwk.e, alg: 'RS256', use: 'sig' };
}

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeToken(
  pair: KeyPair,
  { kid = 'kid-a', alg = 'RS256', claims = {} as Record<string, unknown> } = {},
): Promise<string> {
  const header = b64url(JSON.stringify({ alg, kid, typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: TEAM,
      aud: [AUD],
      email: 'Owner@Example.com',
      sub: 'user-123',
      iat: SEC - 60,
      nbf: SEC - 60,
      exp: SEC + 3600,
      type: 'app',
      ...claims,
    }),
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, pair.privateKey, new TextEncoder().encode(`${header}.${payload}`)),
  );
  return `${header}.${payload}.${b64url(signature)}`;
}

/** A stand-in for the download of the public keys; counts how often it is called. */
function keyServer(keys: unknown[]) {
  const server = {
    calls: 0,
    keys,
    fail: false,
    fetchJson: async (url: string) => {
      server.calls += 1;
      assert.equal(url, `${TEAM}/cdn-cgi/access/certs`); // only the team's own address is ever contacted
      if (server.fail) throw new Error('network down');
      return { keys: server.keys };
    },
  };
  return server;
}

const options = (server: ReturnType<typeof keyServer>, now = NOW) => ({
  teamDomain: TEAM,
  audience: AUD,
  now,
  fetchJson: server.fetchJson,
});

async function rejection(promise: Promise<unknown>): Promise<AuthError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof AuthError, `expected an AuthError, got ${String(error)}`);
    return error;
  }
  assert.fail('expected the token to be rejected');
}

const jwkA = await jwkOf(keyA, 'kid-a');
const jwkB = await jwkOf(keyB, 'kid-b');

beforeEach(() => resetAuthCache());

// ── configuration values ────────────────────────────────────────────────────────

test('team domain: accepted forms are normalised, everything else is refused', () => {
  assert.equal(normalizeTeamDomain('https://myteam.cloudflareaccess.com'), TEAM);
  assert.equal(normalizeTeamDomain('myteam.cloudflareaccess.com'), TEAM);
  assert.equal(normalizeTeamDomain('  HTTPS://MyTeam.CloudflareAccess.com/  '), TEAM);
  assert.equal(normalizeTeamDomain('http://myteam.cloudflareaccess.com'), TEAM); // a pasted http address is turned into https
  for (const bad of ['', 'myteam.example.com', 'https://evil.com/myteam.cloudflareaccess.com', 'myteam.cloudflareaccess.com.evil.com', 'https://my team.cloudflareaccess.com']) {
    assert.equal(normalizeTeamDomain(bad), null, bad);
  }
  assert.equal(normalizeTeamDomain(undefined), null);
});

test('allowed e-mails: lower case, several separators, nonsense ignored', () => {
  assert.deepEqual([...parseAllowedEmails('Owner@Example.com, second@example.com;third@example.com\nfourth@example.com')].sort(), [
    'fourth@example.com', 'owner@example.com', 'second@example.com', 'third@example.com',
  ]);
  assert.equal(parseAllowedEmails('').size, 0);
  assert.equal(parseAllowedEmails(undefined).size, 0);
  assert.equal(parseAllowedEmails('not-an-email, @@, *').size, 0); // no wildcards, no half addresses
});

// ── the token ──────────────────────────────────────────────────────────────────

test('a genuine token is accepted and gives the e-mail (lower case) and the Access user id', async () => {
  const server = keyServer([jwkA]);
  const claims = await verifyAccessJwt(await makeToken(keyA), options(server));
  assert.equal(claims.email, 'owner@example.com');
  assert.equal(claims.sub, 'user-123');
});

test('the audience may be a list; it must contain ours', async () => {
  const server = keyServer([jwkA]);
  assert.ok(await verifyAccessJwt(await makeToken(keyA, { claims: { aud: ['other', AUD] } }), options(server)));
  assert.ok(await verifyAccessJwt(await makeToken(keyA, { claims: { aud: AUD } }), options(server)));
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { aud: ['someone-elses-app'] } }), options(server)))).code, 'invalid_token');
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { aud: undefined } }), options(server)))).code, 'invalid_token');
});

test('a token from another issuer (another Cloudflare team) is rejected', async () => {
  const server = keyServer([jwkA]);
  const token = await makeToken(keyA, { claims: { iss: 'https://otherteam.cloudflareaccess.com' } });
  assert.equal((await rejection(verifyAccessJwt(token, options(server)))).code, 'invalid_token');
});

test('a token signed with a different key is rejected, even if it claims to be kid-a', async () => {
  const server = keyServer([jwkA]);
  const forged = await makeToken(keyB, { kid: 'kid-a' });
  assert.equal((await rejection(verifyAccessJwt(forged, options(server)))).code, 'invalid_token');
});

test('changing anything in the token after it was signed makes it invalid', async () => {
  const server = keyServer([jwkA]);
  const [header, payload, signature] = (await makeToken(keyA)).split('.');
  const edited = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  edited.email = 'attacker@example.com';
  const tampered = `${header}.${b64url(JSON.stringify(edited))}.${signature}`;
  assert.equal((await rejection(verifyAccessJwt(tampered, options(server)))).code, 'invalid_token');
});

test('only RS256 is accepted: "none", HMAC and other algorithms are refused', async () => {
  const server = keyServer([jwkA]);
  for (const alg of ['none', 'HS256', 'RS512', 'ES256']) {
    assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { alg }), options(server)))).code, 'invalid_token', alg);
  }
  const noSignature = `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64url(JSON.stringify({ iss: TEAM, aud: [AUD], email: 'owner@example.com', exp: SEC + 3600 }))}.`;
  assert.equal((await rejection(verifyAccessJwt(noSignature, options(server)))).code, 'invalid_token');
});

test('badly formed tokens are rejected without any key download being trusted', async () => {
  const server = keyServer([jwkA]);
  for (const bad of ['', 'abc', 'a.b', 'a.b.c.d', '..', 'e30.e30.e30', '%%%.%%%.%%%']) {
    assert.equal((await rejection(verifyAccessJwt(bad, options(server)))).code, 'invalid_token', JSON.stringify(bad));
  }
});

test('time: expired and not-yet-valid tokens are rejected, a few seconds of clock difference are tolerated', async () => {
  const server = keyServer([jwkA]);
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { exp: SEC - 3600 } }), options(server)))).code, 'invalid_token');
  assert.ok(await verifyAccessJwt(await makeToken(keyA, { claims: { exp: SEC - 10 } }), options(server))); // inside the 30 s tolerance
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { exp: SEC - 31 } }), options(server)))).code, 'invalid_token');
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { nbf: SEC + 600 } }), options(server)))).code, 'invalid_token');
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { exp: undefined } }), options(server)))).code, 'invalid_token'); // no expiry at all
});

test('a token without an e-mail is rejected', async () => {
  const server = keyServer([jwkA]);
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { email: undefined } }), options(server)))).code, 'invalid_token');
  assert.equal((await rejection(verifyAccessJwt(await makeToken(keyA, { claims: { email: 42 } }), options(server)))).code, 'invalid_token');
});

// ── the public keys ────────────────────────────────────────────────────────────

test('keys are downloaded once and reused', async () => {
  const server = keyServer([jwkA]);
  for (let i = 0; i < 5; i++) await verifyAccessJwt(await makeToken(keyA), options(server));
  assert.equal(server.calls, 1);
});

test('keys are downloaded again after an hour', async () => {
  const server = keyServer([jwkA]);
  await verifyAccessJwt(await makeToken(keyA), options(server));
  await verifyAccessJwt(await makeToken(keyA, { claims: { exp: SEC + 99999 } }), options(server, NOW + 61 * 60 * 1000));
  assert.equal(server.calls, 2);
});

test('a rotated key is picked up: an unknown key id triggers one re-download', async () => {
  const server = keyServer([jwkA]);
  await verifyAccessJwt(await makeToken(keyA), options(server));
  server.keys = [jwkA, jwkB]; // Cloudflare rotated the keys
  const claims = await verifyAccessJwt(await makeToken(keyB, { kid: 'kid-b' }), options(server, NOW + 5000));
  assert.equal(claims.email, 'owner@example.com');
  assert.equal(server.calls, 2);
});

test('an unknown key id cannot make the Worker download keys over and over', async () => {
  const server = keyServer([jwkA]);
  await verifyAccessJwt(await makeToken(keyA), options(server)); // 1 download
  const unknown = await makeToken(keyB, { kid: 'kid-x' });
  await rejection(verifyAccessJwt(unknown, options(server, NOW + 5000))); // one forced re-download
  await rejection(verifyAccessJwt(unknown, options(server, NOW + 6000)));
  await rejection(verifyAccessJwt(unknown, options(server, NOW + 7000)));
  assert.equal(server.calls, 2);
  await rejection(verifyAccessJwt(unknown, options(server, NOW + 70_000))); // a minute later it may try again
  assert.equal(server.calls, 3);
});

test('if the key download fails, the keys already known keep working; with none known the answer is "keys unavailable"', async () => {
  const server = keyServer([jwkA]);
  await verifyAccessJwt(await makeToken(keyA), options(server));
  server.fail = true;
  // an hour later the cache is stale and the download fails, the old keys are used
  assert.ok(await verifyAccessJwt(await makeToken(keyA, { claims: { exp: SEC + 99999 } }), options(server, NOW + 61 * 60 * 1000)));

  resetAuthCache();
  const error = await rejection(verifyAccessJwt(await makeToken(keyA), options(server)));
  assert.equal(error.code, 'keys_unavailable');
});

test('a key download that returns rubbish is not trusted', async () => {
  for (const body of [null, 'text', { keys: 'no' }, { keys: [{ kid: 'kid-a', kty: 'EC' }] }, { keys: [] }]) {
    resetAuthCache();
    const server = { calls: 0, fetchJson: async () => body };
    const error = await rejection(verifyAccessJwt(await makeToken(keyA), { teamDomain: TEAM, audience: AUD, now: NOW, fetchJson: server.fetchJson }));
    assert.ok(['keys_unavailable', 'invalid_token'].includes(error.code), JSON.stringify(body));
  }
});

// ── the whole check of a request ───────────────────────────────────────────────

function configured(overrides: Partial<Env> = {}): Env {
  return { ASSETS: { fetch: async () => new Response('') }, TEAM_DOMAIN: TEAM, POLICY_AUD: AUD, ALLOWED_EMAILS: 'owner@example.com', ...overrides } as Env;
}

function request(token?: string, url = 'https://trainer.example.workers.dev/api/me'): Request {
  return new Request(url, { headers: token ? { 'Cf-Access-Jwt-Assertion': token } : {} });
}

test('request: the owner gets in', async () => {
  const server = keyServer([jwkA]);
  const result = await authenticate(request(await makeToken(keyA)), configured(), { fetchJson: server.fetchJson, now: NOW });
  assert.deepEqual(result, { ok: true, email: 'owner@example.com', sub: 'user-123', source: 'access' });
});

test('request: no token is 401, a bad token is 401, a stranger with a valid Cloudflare login is 403', async () => {
  const server = keyServer([jwkA]);
  const deps = { fetchJson: server.fetchJson, now: NOW };
  assert.deepEqual(await authenticate(request(), configured(), deps), { ok: false, status: 401, code: 'missing_token' });
  assert.deepEqual(await authenticate(request('garbage.token.here'), configured(), deps), { ok: false, status: 401, code: 'invalid_token' });
  const stranger = await makeToken(keyA, { claims: { email: 'stranger@example.com' } });
  assert.deepEqual(await authenticate(request(stranger), configured(), deps), { ok: false, status: 403, code: 'email_not_allowed' });
});

test('request: the list of allowed e-mails is checked every time, not only the Access policy', async () => {
  const server = keyServer([jwkA]);
  const deps = { fetchJson: server.fetchJson, now: NOW };
  const env = configured({ ALLOWED_EMAILS: 'someone.else@example.com' });
  assert.equal((await authenticate(request(await makeToken(keyA)), env, deps)).ok, false);
  const two = configured({ ALLOWED_EMAILS: 'someone.else@example.com, OWNER@example.com' });
  assert.equal((await authenticate(request(await makeToken(keyA)), two, deps)).ok, true);
});

test('request: missing or broken settings close the door (500), they never open it', async () => {
  const server = keyServer([jwkA]);
  const deps = { fetchJson: server.fetchJson, now: NOW };
  const token = await makeToken(keyA);
  for (const env of [
    configured({ TEAM_DOMAIN: undefined }),
    configured({ POLICY_AUD: undefined }),
    configured({ ALLOWED_EMAILS: undefined }),
    configured({ ALLOWED_EMAILS: '' }),
    configured({ TEAM_DOMAIN: 'https://evil.example.com' }),
  ]) {
    const result = await authenticate(request(token), env, deps);
    assert.deepEqual(result, { ok: false, status: 500, code: 'not_configured' });
  }
  assert.equal(server.calls, 0); // nothing was contacted without a valid configuration
});

test('request: when the keys cannot be fetched the answer is 503, not a pass', async () => {
  const server = keyServer([jwkA]);
  server.fail = true;
  const result = await authenticate(request(await makeToken(keyA)), configured(), { fetchJson: server.fetchJson, now: NOW });
  assert.deepEqual(result, { ok: false, status: 503, code: 'keys_unavailable' });
});

// ── the developer sign-in on the own computer ──────────────────────────────────

const devEnv = (overrides: Partial<Env> = {}) => configured({ ALLOW_DEV_AUTH: 'true', DEV_AUTH_EMAIL: 'dev@example.com', ...overrides });

test('developer sign-in works only with the flag, a valid e-mail AND a localhost address', () => {
  assert.equal(isDevAuthAllowed(request(undefined, 'http://localhost:8787/api/me'), devEnv()), true);
  assert.equal(isDevAuthAllowed(request(undefined, 'http://127.0.0.1:8787/api/me'), devEnv()), true);
  assert.equal(isDevAuthAllowed(request(undefined, 'http://[::1]:8787/api/me'), devEnv()), true);

  assert.equal(isDevAuthAllowed(request(undefined, 'https://trainer.example.workers.dev/api/me'), devEnv()), false); // the real site
  assert.equal(isDevAuthAllowed(request(undefined, 'https://localhost.evil.com/api/me'), devEnv()), false);
  assert.equal(isDevAuthAllowed(request(undefined, 'http://localhost:8787/api/me'), devEnv({ ALLOW_DEV_AUTH: undefined })), false);
  assert.equal(isDevAuthAllowed(request(undefined, 'http://localhost:8787/api/me'), devEnv({ ALLOW_DEV_AUTH: 'yes' })), false);
  assert.equal(isDevAuthAllowed(request(undefined, 'http://localhost:8787/api/me'), devEnv({ DEV_AUTH_EMAIL: undefined })), false);
  assert.equal(isDevAuthAllowed(request(undefined, 'http://localhost:8787/api/me'), devEnv({ DEV_AUTH_EMAIL: 'not an email' })), false);
});

test('developer sign-in: on localhost without a token it lets you in as the developer', async () => {
  const result = await authenticate(request(undefined, 'http://localhost:8787/api/me'), devEnv(), {});
  assert.deepEqual(result, { ok: true, email: 'dev@example.com', sub: null, source: 'dev' });
});

test('developer sign-in never opens the real site, even if the flag is set there by mistake', async () => {
  const env = devEnv({ TEAM_DOMAIN: undefined, POLICY_AUD: undefined });
  const real = await authenticate(request(undefined, 'https://trainer.example.workers.dev/api/me'), env, {});
  assert.equal(real.ok, false);
  const withConfig = await authenticate(request(undefined, 'https://trainer.example.workers.dev/api/me'), devEnv(), {});
  assert.deepEqual(withConfig, { ok: false, status: 401, code: 'missing_token' });
});

test('developer sign-in does not excuse a bad token on localhost', async () => {
  const server = keyServer([jwkA]);
  const result = await authenticate(request('garbage.token.here', 'http://localhost:8787/api/me'), devEnv(), { fetchJson: server.fetchJson, now: NOW });
  assert.deepEqual(result, { ok: false, status: 401, code: 'invalid_token' });
});

import type { Env } from './types';

// Sign-in is done by Cloudflare Access. Access puts a signed pass (a JWT) in the header
// "Cf-Access-Jwt-Assertion". The Worker NEVER trusts the header just because it is there:
// it checks the signature with the public keys of the team, the issuer, the audience (AUD),
// the expiry, and then that the e-mail is on the allowed list.

export type AuthErrorCode =
  | 'not_configured'
  | 'missing_token'
  | 'invalid_token'
  | 'keys_unavailable'
  | 'email_not_allowed';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export type AuthResult =
  | { ok: true; email: string; sub: string | null; source: 'access' | 'dev' }
  | { ok: false; status: 401 | 403 | 500 | 503; code: AuthErrorCode };

export interface AccessClaims {
  email: string;
  sub: string | null;
  exp: number;
}

/** Downloads and parses JSON. Replaced in tests. */
export type FetchJson = (url: string) => Promise<unknown>;

const defaultFetchJson: FetchJson = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`keys_http_${response.status}`);
  return response.json();
};

const KEY_TTL_MS = 60 * 60 * 1000; // public keys are kept for an hour
const MIN_FORCED_REFRESH_MS = 60 * 1000; // an unknown key id may trigger a re-download at most once a minute
const LEEWAY_SECONDS = 30; // tolerated difference between clocks
const HEADER = 'cf-access-jwt-assertion';

// ── helpers ─────────────────────────────────────────────────────────────────

/** "https://team.cloudflareaccess.com" from what the owner typed, or null if it does not look like one. */
export function normalizeTeamDomain(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return /^[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/.test(trimmed) ? `https://${trimmed}` : null;
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function parseAllowedEmails(value: string | undefined): Set<string> {
  const emails = (value ?? '')
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL.test(e));
  return new Set(emails);
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function parseJsonPart(part: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
  } catch {
    throw new AuthError('invalid_token', 'malformed');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new AuthError('invalid_token', 'malformed');
  return value as Record<string, unknown>;
}

// ── public keys of the team ─────────────────────────────────────────────────

interface Jwk {
  kty?: string;
  kid?: string;
  n?: string;
  e?: string;
}

interface KeyCache {
  fetchedAt: number;
  lastForcedRefresh: number;
  keys: Map<string, CryptoKey>;
}

const caches = new Map<string, KeyCache>();

/** For tests. */
export function resetAuthCache(): void {
  caches.clear();
}

async function downloadKeys(teamDomain: string, fetchJson: FetchJson): Promise<Map<string, CryptoKey>> {
  const body = (await fetchJson(`${teamDomain}/cdn-cgi/access/certs`)) as { keys?: Jwk[] };
  const keys = new Map<string, CryptoKey>();
  for (const jwk of Array.isArray(body?.keys) ? body.keys : []) {
    if (jwk.kty !== 'RSA' || typeof jwk.kid !== 'string' || typeof jwk.n !== 'string' || typeof jwk.e !== 'string') continue;
    try {
      const key = await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      keys.set(jwk.kid, key);
    } catch {
      // a key that cannot be read is skipped
    }
  }
  return keys;
}

async function refreshKeys(teamDomain: string, fetchJson: FetchJson, now: number, forced: boolean): Promise<KeyCache> {
  const old = caches.get(teamDomain);
  try {
    const keys = await downloadKeys(teamDomain, fetchJson);
    if (keys.size === 0) throw new Error('no_keys');
    const cache = { fetchedAt: now, lastForcedRefresh: forced ? now : (old?.lastForcedRefresh ?? 0), keys };
    caches.set(teamDomain, cache);
    return cache;
  } catch {
    // keep working with the old keys if the download fails
    if (old) {
      if (forced) old.lastForcedRefresh = now;
      return old;
    }
    throw new AuthError('keys_unavailable');
  }
}

async function getVerificationKey(teamDomain: string, kid: string, fetchJson: FetchJson, now: number): Promise<CryptoKey> {
  let cache = caches.get(teamDomain);
  if (!cache || now - cache.fetchedAt > KEY_TTL_MS) cache = await refreshKeys(teamDomain, fetchJson, now, false);
  let key = cache.keys.get(kid);
  if (!key && now - cache.lastForcedRefresh > MIN_FORCED_REFRESH_MS) {
    // Cloudflare rotates the keys: a pass signed with a new key shows up before our cache expires
    cache = await refreshKeys(teamDomain, fetchJson, now, true);
    key = cache.keys.get(kid);
  }
  if (!key) throw new AuthError('invalid_token', 'unknown_key');
  return key;
}

// ── checking the pass ───────────────────────────────────────────────────────

export async function verifyAccessJwt(
  token: string,
  options: { teamDomain: string; audience: string; now?: number; fetchJson?: FetchJson },
): Promise<AccessClaims> {
  const now = options.now ?? Date.now();
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) throw new AuthError('invalid_token', 'malformed');

  const header = parseJsonPart(parts[0]);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new AuthError('invalid_token', 'algorithm');

  // 1. the signature, before anything in the pass is believed
  const key = await getVerificationKey(options.teamDomain, header.kid, options.fetchJson ?? defaultFetchJson, now);
  let signatureOk = false;
  try {
    signatureOk = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(parts[2]).buffer as ArrayBuffer, // a fresh, exactly sized buffer
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) throw new AuthError('invalid_token', 'signature');

  // 2. the claims
  const payload = parseJsonPart(parts[1]);
  const seconds = Math.floor(now / 1000);
  if (payload.iss !== options.teamDomain) throw new AuthError('invalid_token', 'issuer');
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(options.audience)) throw new AuthError('invalid_token', 'audience');
  if (typeof payload.exp !== 'number' || payload.exp + LEEWAY_SECONDS < seconds) throw new AuthError('invalid_token', 'expired');
  if (typeof payload.nbf === 'number' && payload.nbf - LEEWAY_SECONDS > seconds) throw new AuthError('invalid_token', 'not_yet_valid');
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email)) throw new AuthError('invalid_token', 'no_email');

  return { email, sub: typeof payload.sub === 'string' ? payload.sub : null, exp: payload.exp };
}

// ── development sign-in (only on the developer's own computer) ──────────────

/**
 * The development sign-in works only when BOTH are true: the variable ALLOW_DEV_AUTH=true was set in
 * the local file .dev.vars (that file is not in GitHub) AND the request comes to localhost.
 * The production site has no such variable and is never reached as "localhost".
 */
export function isDevAuthAllowed(request: Request, env: Env): boolean {
  if (env.ALLOW_DEV_AUTH !== 'true') return false;
  if (!EMAIL.test((env.DEV_AUTH_EMAIL ?? '').trim())) return false;
  const host = new URL(request.url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

// ── the entry point used by the API ─────────────────────────────────────────

export async function authenticate(
  request: Request,
  env: Env,
  deps: { now?: number; fetchJson?: FetchJson } = {},
): Promise<AuthResult> {
  const token = request.headers.get(HEADER);

  if (!token && isDevAuthAllowed(request, env)) {
    return { ok: true, email: (env.DEV_AUTH_EMAIL ?? '').trim().toLowerCase(), sub: null, source: 'dev' };
  }

  const teamDomain = normalizeTeamDomain(env.TEAM_DOMAIN ?? '');
  const audience = (env.POLICY_AUD ?? '').trim();
  const allowed = parseAllowedEmails(env.ALLOWED_EMAILS);
  // closed by default: without the full configuration nobody gets in
  if (!teamDomain || !audience || allowed.size === 0) return { ok: false, status: 500, code: 'not_configured' };
  if (!token) return { ok: false, status: 401, code: 'missing_token' };

  let claims: AccessClaims;
  try {
    claims = await verifyAccessJwt(token, { teamDomain, audience, now: deps.now, fetchJson: deps.fetchJson });
  } catch (error) {
    if (error instanceof AuthError && error.code === 'keys_unavailable') return { ok: false, status: 503, code: 'keys_unavailable' };
    return { ok: false, status: 401, code: 'invalid_token' };
  }

  if (!allowed.has(claims.email)) return { ok: false, status: 403, code: 'email_not_allowed' };
  return { ok: true, email: claims.email, sub: claims.sub, source: 'access' };
}

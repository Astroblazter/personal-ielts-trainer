import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRequestOrigin, errorResponse, jsonResponse, readJsonBody } from '../worker/security';

const URL_ = 'https://site.example.workers.dev/api/things';

function post(headers: Record<string, string>, body: string | null = '{"a":1}', method = 'POST'): Request {
  return new Request(URL_, { method, headers, body });
}

const json = { 'content-type': 'application/json' };

test('reading requests need no origin check', () => {
  for (const method of ['GET', 'HEAD']) {
    assert.deepEqual(checkRequestOrigin(new Request(URL_, { method, headers: { 'sec-fetch-site': 'cross-site' } })), { ok: true });
  }
});

test('writing requests from the site itself are accepted', () => {
  assert.deepEqual(checkRequestOrigin(post({ ...json, 'sec-fetch-site': 'same-origin' })), { ok: true });
  assert.deepEqual(checkRequestOrigin(post({ ...json, origin: 'https://site.example.workers.dev' })), { ok: true });
});

test('writing requests from another site are refused', () => {
  assert.equal(checkRequestOrigin(post({ ...json, 'sec-fetch-site': 'cross-site' })).ok, false);
  assert.equal(checkRequestOrigin(post({ ...json, 'sec-fetch-site': 'same-site' })).ok, false);
  assert.equal(checkRequestOrigin(post({ ...json, origin: 'https://evil.example.com' })).ok, false);
  assert.equal(checkRequestOrigin(post({ ...json, origin: 'https://site.example.workers.dev.evil.com' })).ok, false);
  assert.equal(checkRequestOrigin(post({ ...json, origin: 'null' })).ok, false);
  // the browser says "same-origin" but the Origin header disagrees: refuse
  assert.equal(checkRequestOrigin(post({ ...json, 'sec-fetch-site': 'same-origin', origin: 'https://evil.example.com' })).ok, false);
});

test('a writing request that does not say where it comes from is refused', () => {
  assert.equal(checkRequestOrigin(post(json)).ok, false);
});

test('writing requests must be JSON (a plain form post is refused)', () => {
  for (const method of ['POST', 'PUT', 'PATCH']) {
    const result = checkRequestOrigin(post({ 'sec-fetch-site': 'same-origin', 'content-type': 'text/plain' }, 'x', method));
    assert.equal(result.ok, false, method);
    assert.equal(result.ok === false && result.code, 'bad_content_type', method);
  }
  assert.equal(checkRequestOrigin(post({ 'sec-fetch-site': 'same-origin', 'content-type': 'application/x-www-form-urlencoded' }, 'a=1')).ok, false);
  assert.equal(checkRequestOrigin(post({ 'sec-fetch-site': 'same-origin', 'content-type': 'application/json; charset=utf-8' })).ok, true);
});

test('responses are never cached and never guessed to be something else', async () => {
  const response = jsonResponse({ hello: 'world' }, 201);
  assert.equal(response.status, 201);
  assert.match(response.headers.get('content-type') ?? '', /^application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await response.json(), { hello: 'world' });
});

test('an error response has a code and a short message, nothing else', async () => {
  const response = errorResponse(403, 'forbidden', 'No access');
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { error: { code: 'forbidden', message: 'No access' } });
});

test('reading a JSON body: valid, empty, broken', async () => {
  assert.deepEqual(await readJsonBody(post(json, '{"a":[1,2,3]}'), 1000), { ok: true, value: { a: [1, 2, 3] } });
  const empty = await readJsonBody(post(json, ''), 1000);
  assert.equal(empty.ok, false);
  const broken = await readJsonBody(post(json, '{not json'), 1000);
  assert.equal(broken.ok, false);
  assert.equal(broken.ok === false && broken.status, 400);
});

test('a body that is too large is refused, by the announced size and by the real size', async () => {
  const big = JSON.stringify({ text: 'x'.repeat(2000) });
  const byHeader = await readJsonBody(post({ ...json, 'content-length': String(big.length) }, big), 1000);
  assert.equal(byHeader.ok, false);
  assert.equal(byHeader.ok === false && byHeader.status, 413);
  // a lying (missing) Content-Length does not help
  const real = await readJsonBody(post(json, big), 1000);
  assert.equal(real.ok, false);
  assert.equal(real.ok === false && real.status, 413);
  // the limit counts bytes, not characters: 600 Cyrillic letters are 1200 bytes
  const cyrillic = JSON.stringify({ t: 'я'.repeat(600) });
  assert.equal((await readJsonBody(post(json, cyrillic), 1000)).ok, false);
  assert.equal((await readJsonBody(post(json, cyrillic), 5000)).ok, true);
});

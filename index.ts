import { authenticate, type AuthErrorCode } from './auth';
import { checkRequestOrigin, errorResponse, jsonResponse } from './security';
import type { Env } from './types';

const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  not_configured: 'The server is not configured yet.',
  missing_token: 'Sign-in is required.',
  invalid_token: 'The sign-in is not valid. Reload the page and sign in again.',
  keys_unavailable: 'Sign-in cannot be checked right now. Try again in a minute.',
  email_not_allowed: 'This account is not allowed to use the site.',
};

/** Is the database reachable? Says nothing about its structure or contents. */
async function databaseStatus(env: Env): Promise<'ok' | 'unavailable' | 'not_configured'> {
  if (!env.DB) return 'not_configured';
  try {
    await env.DB.prepare('SELECT 1 AS ok').first();
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  // 1. who is it? every /api/ address needs a valid sign-in; there is no public part
  const auth = await authenticate(request, env);
  if (!auth.ok) {
    console.error('auth_failed', auth.code);
    return errorResponse(auth.status, auth.code, AUTH_MESSAGES[auth.code]);
  }

  // 2. did the request come from our own page?
  const origin = checkRequestOrigin(request);
  if (!origin.ok) {
    console.error('request_rejected', origin.code);
    return errorResponse(origin.code === 'bad_content_type' ? 415 : 403, origin.code, 'The request was rejected.');
  }

  const method = request.method.toUpperCase();
  switch (url.pathname) {
    case '/api/health':
      if (method !== 'GET') return errorResponse(405, 'method_not_allowed', 'Method not allowed.', { allow: 'GET' });
      return jsonResponse({ ok: true, time: Date.now(), database: await databaseStatus(env) });
    case '/api/me':
      if (method !== 'GET') return errorResponse(405, 'method_not_allowed', 'Method not allowed.', { allow: 'GET' });
      return jsonResponse({ email: auth.email, source: auth.source });
    default:
      return errorResponse(404, 'not_found', 'Not found.');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // the website itself is served from the built files; only /api/ is handled here
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await handleApi(request, env, url);
    } catch (error) {
      console.error('api_error', error instanceof Error ? error.name : 'unknown');
      return errorResponse(500, 'server_error', 'Something went wrong.');
    }
  },
};

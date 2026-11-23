// Protection of the API against requests that were not made by our own pages, and safe responses.

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export type RequestCheck = { ok: true } | { ok: false; code: 'cross_site_request' | 'bad_content_type' };

/**
 * Requests that change data must come from our own page (CSRF protection):
 * the browser marks them "same-origin" (Sec-Fetch-Site), or sends our own address in Origin.
 * A body must be JSON: an HTML form of another site cannot send that without our permission.
 */
export function checkRequestOrigin(request: Request): RequestCheck {
  if (!UNSAFE_METHODS.has(request.method.toUpperCase())) return { ok: true };

  const ownOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');

  // Both signals must agree: a browser that marks the request "same-origin" also sends our own address.
  if (origin !== null && origin !== ownOrigin) return { ok: false, code: 'cross_site_request' };
  if (site !== null) {
    if (site !== 'same-origin') return { ok: false, code: 'cross_site_request' };
  } else if (origin === null) {
    return { ok: false, code: 'cross_site_request' }; // no information where the request comes from
  }

  if (BODY_METHODS.has(request.method.toUpperCase())) {
    const type = (request.headers.get('content-type') ?? '').toLowerCase();
    if (!type.startsWith('application/json')) return { ok: false, code: 'bad_content_type' };
  }
  return { ok: true };
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      ...headers,
    },
  });
}

export function errorResponse(status: number, code: string, message: string, headers: Record<string, string> = {}): Response {
  return jsonResponse({ error: { code, message } }, status, headers);
}

export type BodyResult = { ok: true; value: unknown } | { ok: false; status: 400 | 413; code: 'invalid_json' | 'payload_too_large' };

/** Reads a JSON body of at most `maxBytes`. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<BodyResult> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413, code: 'payload_too_large' };
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) return { ok: false, status: 413, code: 'payload_too_large' };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, code: 'invalid_json' };
  }
}

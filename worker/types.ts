// Small description of the Cloudflare objects the Worker uses, so that no extra npm package is needed.

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

/**
 * Bindings and secrets of the Worker.
 * ASSETS and DB are bindings from wrangler.jsonc; the rest are SECRETS set in the Cloudflare dashboard
 * (never written in the repository).
 */
export interface Env {
  /** The built website (files of the dist folder). */
  ASSETS: Fetcher;
  /** The D1 database. Not connected yet in the first version. */
  DB?: D1Database;
  /** Address of the Cloudflare Access team, for example https://myteam.cloudflareaccess.com */
  TEAM_DOMAIN?: string;
  /** "Application Audience (AUD) tag" of the Access application that protects the Worker. */
  POLICY_AUD?: string;
  /** E-mail addresses allowed to use the site, separated by commas. */
  ALLOWED_EMAILS?: string;
  /** Local development only (.dev.vars): "true" lets requests from localhost in without Access. */
  ALLOW_DEV_AUTH?: string;
  /** Local development only (.dev.vars): the e-mail used by the development sign-in. */
  DEV_AUTH_EMAIL?: string;
}

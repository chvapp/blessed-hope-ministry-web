export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Optional R2 bucket for admin image uploads (used only when S3 isn't configured). */
  MEDIA?: R2Bucket;
  /** Optional Workers rate limiter for the admin login endpoint. */
  LOGIN_LIMITER?: RateLimit;

  // Plain vars (wrangler.jsonc "vars")
  APP_URL?: string;
  DEFAULT_COUNTRY_CODE?: string;
  BROADCAST_BATCH_SIZE?: string;
  WHATSAPP_API_VERSION?: string;
  PAYSTACK_PUBLIC_KEY?: string;

  // Secrets (wrangler secret put / .dev.vars)
  SESSION_SECRET?: string;
  ADMIN_SETUP_TOKEN?: string;
  PAYSTACK_SECRET_KEY?: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_VERIFY_TOKEN?: string;
  /** Amazon S3 for admin image uploads; all four must be set. */
  S3_BUCKET?: string;
  S3_REGION?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
}

export type Role = 'super_admin' | 'admin' | 'editor';

export interface AdminPrincipal {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type AppBindings = { Bindings: Env; Variables: { admin: AdminPrincipal } };

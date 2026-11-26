import type { Context, Next } from 'hono';
import type { AdminPrincipal, AppBindings, Env, Role } from '../env.ts';
import { hmacHex, safeEqual } from './util.ts';

const PBKDF2_ITERATIONS = 100_000; // Workers' maximum supported iteration count
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2-sha256' || !iter || !saltB64 || !hashB64) return false;
  const hash = await pbkdf2(password, fromB64url(saltB64), Number(iter));
  return safeEqual(b64url(hash), hashB64);
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 10) return 'Password must be at least 10 characters.';
  if (pw.length > 200) return 'Password is too long.';
  return null;
}

function signingSecret(env: Env): string {
  const s = env.SESSION_SECRET?.trim();
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET is not configured (it must be at least 32 characters).');
  }
  return s;
}

interface TokenPayload {
  sub: string;
  ver: number;
  exp: number;
}

export async function issueToken(env: Env, userId: string, sessionVersion: number): Promise<string> {
  const payload: TokenPayload = { sub: userId, ver: sessionVersion, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacHex('SHA-256', signingSecret(env), body);
  return `${body}.${sig}`;
}

async function readToken(env: Env, token: string): Promise<TokenPayload | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = await hmacHex('SHA-256', signingSecret(env), body);
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as TokenPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Resolves the signed-in admin from the Authorization header, or null. */
export async function getAdmin(env: Env, authHeader: string | undefined): Promise<AdminPrincipal | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = await readToken(env, authHeader.slice(7).trim());
  if (!payload) return null;
  const row = await env.DB.prepare(
    'SELECT id, email, name, role, is_active, session_version FROM admin_users WHERE id = ?'
  )
    .bind(payload.sub)
    .first<{ id: string; email: string; name: string; role: Role; is_active: number; session_version: number }>();
  if (!row || !row.is_active || row.session_version !== payload.ver) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

const RANK: Record<Role, number> = { editor: 1, admin: 2, super_admin: 3 };

/** Hono middleware: require a signed-in admin with at least `minRole`. */
export function requireRole(minRole: Role) {
  return async (c: Context<AppBindings>, next: Next) => {
    let admin: AdminPrincipal | null;
    try {
      admin = await getAdmin(c.env, c.req.header('Authorization'));
    } catch (err) {
      console.error(err);
      return c.json({ error: 'Admin sign-in is not configured on the server.' }, 500);
    }
    if (!admin) return c.json({ error: 'Your session has expired. Please sign in again.' }, 401);
    if (RANK[admin.role] < RANK[minRole]) return c.json({ error: 'You do not have permission to do that.' }, 403);
    c.set('admin', admin);
    await next();
  };
}

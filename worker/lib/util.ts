export const nowIso = () => new Date().toISOString();

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Accepts http(s) URLs and site-relative paths for bundled images or R2 uploads. */
export function isAssetOrUrl(value: string): boolean {
  if (!value) return true;
  if (/^\/(images|media)\/[\w./-]+$/.test(value)) return true;
  return isHttpUrl(value);
}

export function str(v: unknown, max = 5000): string {
  return String(v ?? '').trim().slice(0, max);
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hmacHex(algorithm: 'SHA-256' | 'SHA-512', secret: string, data: ArrayBuffer | string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: algorithm }, false, ['sign']);
  const payload = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return toHex(await crypto.subtle.sign('HMAC', key, payload));
}

/**
 * Normalise a phone number to E.164 digits without '+'.
 * Local numbers with a leading 0 get the default country code (234 = Nigeria).
 */
export function normalizePhone(input: string, defaultCountryCode = '234'): string | null {
  let digits = String(input || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = defaultCountryCode + digits.slice(1);
  digits = digits.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function normalizeTags(input: unknown): string {
  const list = Array.isArray(input) ? input : String(input ?? '').split(',');
  return Array.from(new Set(list.map((t) => String(t).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')).filter(Boolean)))
    .slice(0, 20)
    .join(',');
}

export function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  // Neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

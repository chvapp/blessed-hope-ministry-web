import type { Env } from '../env.ts';
import type { DonationRow } from './data.ts';
import { hmacHex, safeEqual } from './util.ts';

export type DonationStatus = 'pending' | 'success' | 'failed';

export interface VerifiedCharge {
  status: DonationStatus;
  gatewayResponse: string;
  paidAt: string | null;
  amountMinor: number;
  currency: string;
}

const API = 'https://api.paystack.co';

export async function initializeTransaction(
  secretKey: string,
  body: { email: string; amount: number; currency: string; reference: string; callback_url: string; metadata: Record<string, unknown> }
): Promise<{ authorizationUrl: string; accessCode: string }> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; access_code?: string };
  };
  if (!res.ok || !json.status || !json.data?.authorization_url) {
    throw new Error(json.message || 'Paystack rejected the transaction.');
  }
  return { authorizationUrl: json.data.authorization_url, accessCode: json.data.access_code || '' };
}

export async function verifyTransaction(secretKey: string, reference: string): Promise<VerifiedCharge> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { status?: string; gateway_response?: string; paid_at?: string | null; amount?: number; currency?: string };
  };
  if (!res.ok || !json.status || !json.data) throw new Error(json.message || 'Unable to verify Paystack transaction.');
  const s = json.data.status;
  const status: DonationStatus = s === 'success' ? 'success' : s === 'failed' || s === 'abandoned' || s === 'reversed' ? 'failed' : 'pending';
  return {
    status,
    gatewayResponse: json.data.gateway_response || s || 'Verified',
    paidAt: json.data.paid_at || (status === 'success' ? new Date().toISOString() : null),
    amountMinor: Number(json.data.amount || 0),
    currency: String(json.data.currency || ''),
  };
}

/**
 * A charge only counts as successful when Paystack's amount and currency match what
 * we initialised. Returns the fields to write back to the donation row.
 */
export function reconcile(row: Pick<DonationRow, 'amount_minor' | 'currency'>, v: VerifiedCharge) {
  const matches = v.amountMinor === row.amount_minor && v.currency.toUpperCase() === row.currency;
  if (v.status === 'success' && !matches) {
    return {
      status: 'failed' as const,
      gatewayResponse: `Amount/currency mismatch (Paystack reported ${v.currency} ${(v.amountMinor / 100).toFixed(2)})`,
      paidAt: null,
    };
  }
  return { status: v.status, gatewayResponse: v.gatewayResponse, paidAt: v.paidAt };
}

export async function applyVerification(env: Env, reference: string, v: VerifiedCharge) {
  const row = await env.DB.prepare('SELECT * FROM donations WHERE reference = ?').bind(reference).first<DonationRow>();
  if (!row) return null;
  // Never downgrade an already-confirmed gift.
  if (row.status === 'success') return row;
  const next = reconcile(row, v);
  await env.DB.prepare('UPDATE donations SET status = ?, gateway_response = ?, paid_at = ? WHERE reference = ?')
    .bind(next.status, next.gatewayResponse, next.paidAt, reference)
    .run();
  return { ...row, status: next.status, gateway_response: next.gatewayResponse, paid_at: next.paidAt };
}

export async function verifyWebhookSignature(env: Env, rawBody: ArrayBuffer, signature: string): Promise<boolean> {
  const secret = env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || !signature) return false;
  const expected = await hmacHex('SHA-512', secret, rawBody);
  return safeEqual(signature, expected);
}

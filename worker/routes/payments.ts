import { Hono } from 'hono';
import type { AppBindings } from '../env.ts';
import type { DonationRow } from '../lib/data.ts';
import { applyVerification, initializeTransaction, verifyTransaction, verifyWebhookSignature } from '../lib/paystack.ts';
import { EMAIL_RE, newId, nowIso, str } from '../lib/util.ts';

// Paystack settles NGN natively; USD must be enabled on the Paystack account.
const CURRENCIES = ['NGN', 'USD'] as const;
const FUNDS = ['tithe', 'offering', 'partnership', 'project'] as const;
const MIN_MAJOR: Record<(typeof CURRENCIES)[number], number> = { NGN: 100, USD: 1 };

export const paymentRoutes = new Hono<AppBindings>();

paymentRoutes.get('/config', (c) =>
  c.json({
    configured: Boolean(c.env.PAYSTACK_SECRET_KEY?.trim()),
    publicKey: c.env.PAYSTACK_PUBLIC_KEY?.trim() || '',
    currencies: CURRENCIES,
    categories: FUNDS,
  })
);

paymentRoutes.post('/initialize', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const donorName = str(b.donorName, 120);
  const donorEmail = str(b.donorEmail, 200);
  const category = str(b.category) as (typeof FUNDS)[number];
  const currency = (str(b.currency) || 'NGN') as (typeof CURRENCIES)[number];
  const amountMajor = Number(b.amount);

  if (!donorName) return c.json({ error: 'Please enter your full name.' }, 400);
  if (!EMAIL_RE.test(donorEmail)) return c.json({ error: 'Please enter a valid email address for your receipt.' }, 400);
  if (!FUNDS.includes(category)) return c.json({ error: 'Please choose a fund.' }, 400);
  if (!CURRENCIES.includes(currency)) return c.json({ error: 'Unsupported currency.' }, 400);
  if (!Number.isFinite(amountMajor) || amountMajor < MIN_MAJOR[currency] || amountMajor > 100_000_000) {
    return c.json({ error: `Please enter an amount of at least ${currency === 'NGN' ? '₦100' : '$1'}.` }, 400);
  }

  const secretKey = c.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return c.json({ configured: false, error: 'Online giving is not available yet. Please try again later.' }, 503);
  }

  const amountMinor = Math.round(amountMajor * 100);
  const reference = `BHM-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const origin = c.env.APP_URL?.replace(/\/+$/, '') || new URL(c.req.url).origin;

  await c.env.DB.prepare(
    `INSERT INTO donations (id, reference, donor_name, donor_email, category, currency, amount_minor, status, gateway_response, paid_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'Checkout started', NULL, ?)`
  )
    .bind(newId('don'), reference, donorName, donorEmail, category, currency, amountMinor, nowIso())
    .run();

  try {
    const { authorizationUrl, accessCode } = await initializeTransaction(secretKey, {
      email: donorEmail,
      amount: amountMinor,
      currency,
      reference,
      callback_url: `${origin}/give?reference=${encodeURIComponent(reference)}`,
      metadata: { donorName, category, ministry: 'Blessed Hope Gospel Ministry' },
    });
    return c.json({ reference, authorizationUrl, accessCode });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paystack rejected the transaction.';
    await c.env.DB.prepare(`UPDATE donations SET status = 'failed', gateway_response = ? WHERE reference = ?`)
      .bind(message.slice(0, 300), reference)
      .run();
    console.error('Paystack initialize failed:', message);
    return c.json({ error: 'We could not start the payment. Please try again.' }, 502);
  }
});

paymentRoutes.get('/verify/:reference', async (c) => {
  const reference = str(c.req.param('reference'), 100);
  if (!/^BHM-[A-Za-z0-9-]{4,60}$/.test(reference)) {
    return c.json({ error: 'Please enter a valid giving reference (it starts with BHM-).' }, 400);
  }
  let row = await c.env.DB.prepare('SELECT * FROM donations WHERE reference = ?').bind(reference).first<DonationRow>();
  if (!row) return c.json({ error: 'No giving record matches that reference.' }, 404);

  const secretKey = c.env.PAYSTACK_SECRET_KEY?.trim();
  if (secretKey && row.status !== 'success') {
    try {
      row = (await applyVerification(c.env, reference, await verifyTransaction(secretKey, reference))) ?? row;
    } catch (err) {
      console.error('Paystack verify failed:', err);
      return c.json({ error: 'We could not confirm this payment with Paystack right now. Please try again shortly.' }, 502);
    }
  }

  // Public receipt: never expose the donor's email.
  return c.json({
    donation: {
      reference: row.reference,
      donorName: row.donor_name,
      category: row.category,
      currency: row.currency,
      amountMinor: row.amount_minor,
      status: row.status,
      gatewayResponse: row.gateway_response,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    },
  });
});

/** Paystack webhook: signature is an HMAC-SHA512 of the raw body with the secret key. */
paymentRoutes.post('/webhook', async (c) => {
  const raw = await c.req.arrayBuffer();
  if (!(await verifyWebhookSignature(c.env, raw, c.req.header('x-paystack-signature') || ''))) {
    return c.json({ error: 'Invalid signature.' }, 401);
  }
  let event: { event?: string; data?: { reference?: string; status?: string; gateway_response?: string; paid_at?: string; amount?: number; currency?: string } };
  try {
    event = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return c.json({ error: 'Malformed payload.' }, 400);
  }
  const d = event.data;
  if (event.event === 'charge.success' && d?.reference) {
    await applyVerification(c.env, d.reference, {
      status: 'success',
      gatewayResponse: d.gateway_response || 'Approved',
      paidAt: d.paid_at || nowIso(),
      amountMinor: Number(d.amount || 0),
      currency: String(d.currency || ''),
    });
  }
  return c.json({ received: true });
});

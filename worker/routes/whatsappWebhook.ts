import { Hono } from 'hono';
import type { AppBindings } from '../env.ts';
import { nowIso, safeEqual } from '../lib/util.ts';
import { verifyMetaSignature } from '../lib/whatsapp.ts';

export const whatsappWebhook = new Hono<AppBindings>();

/** Meta's one-time webhook verification handshake. */
whatsappWebhook.get('/', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token') || '';
  const challenge = c.req.query('hub.challenge') || '';
  const expected = c.env.WHATSAPP_VERIFY_TOKEN || '';
  if (mode === 'subscribe' && expected && safeEqual(token, expected)) return c.text(challenge);
  return c.text('Forbidden', 403);
});

const STOP_WORDS = new Set(['stop', 'unsubscribe', 'cancel', 'end', 'quit', 'stop all']);
const START_WORDS = new Set(['start', 'subscribe', 'unstop']);

/** Delivery receipts update broadcast stats; STOP/START replies manage opt-out. */
whatsappWebhook.post('/', async (c) => {
  const raw = await c.req.arrayBuffer();
  if (!(await verifyMetaSignature(c.env, raw, c.req.header('x-hub-signature-256')))) {
    return c.text('Invalid signature', 401);
  }
  type Change = {
    value?: {
      statuses?: Array<{ id: string; status: string; errors?: Array<{ title?: string; message?: string }> }>;
      messages?: Array<{ from: string; type: string; text?: { body?: string }; button?: { text?: string } }>;
    };
  };
  let payload: { entry?: Array<{ changes?: Change[] }> };
  try {
    payload = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return c.text('Bad payload', 400);
  }

  const stmts: D1PreparedStatement[] = [];
  const ts = nowIso();
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const s of change.value?.statuses || []) {
        if (!['delivered', 'read', 'failed'].includes(s.status)) continue;
        const err = s.errors?.[0];
        stmts.push(
          c.env.DB.prepare(
            `UPDATE broadcast_recipients SET status = ?, error = COALESCE(?, error), updated_at = ?
             WHERE wa_message_id = ? AND status NOT IN ('read')`
          ).bind(s.status, err ? (err.message || err.title || 'Failed').slice(0, 300) : null, ts, s.id)
        );
      }
      for (const m of change.value?.messages || []) {
        const text = (m.text?.body || m.button?.text || '').trim().toLowerCase();
        if (STOP_WORDS.has(text)) {
          stmts.push(c.env.DB.prepare('UPDATE subscribers SET whatsapp_opt_in = 0, opted_out_at = ? WHERE phone = ?').bind(ts, m.from));
        } else if (START_WORDS.has(text)) {
          stmts.push(c.env.DB.prepare('UPDATE subscribers SET whatsapp_opt_in = 1, opted_out_at = NULL WHERE phone = ?').bind(m.from));
        }
      }
    }
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  return c.text('OK');
});

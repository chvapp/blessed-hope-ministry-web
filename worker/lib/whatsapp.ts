import type { Env } from '../env.ts';
import { hmacHex, nowIso, safeEqual } from './util.ts';

/**
 * WhatsApp Business Cloud API (Meta). Business-initiated bulk messages must use
 * pre-approved message templates; free-form text is only allowed within 24h of the
 * member messaging the church first.
 */

export function whatsappConfigured(env: Env): boolean {
  return Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

function graph(env: Env, path: string) {
  return `https://graph.facebook.com/${env.WHATSAPP_API_VERSION || 'v23.0'}/${path}`;
}

export interface TemplateSummary {
  name: string;
  language: string;
  category: string;
  status: string;
  bodyText: string;
  bodyParamCount: number;
}

export async function listTemplates(env: Env): Promise<TemplateSummary[]> {
  if (!env.WHATSAPP_BUSINESS_ACCOUNT_ID || !env.WHATSAPP_TOKEN) throw new Error('WhatsApp Business Account ID is not configured.');
  const res = await fetch(graph(env, `${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?fields=name,language,status,category,components&limit=200`), {
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` },
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: Array<{ name: string; language: string; status: string; category: string; components?: Array<{ type: string; text?: string }> }>;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json.error?.message || 'Unable to load WhatsApp templates.');
  return (json.data || []).map((t) => {
    const body = t.components?.find((c) => c.type === 'BODY')?.text || '';
    const params = new Set(body.match(/\{\{\s*\d+\s*\}\}/g) || []);
    return { name: t.name, language: t.language, category: t.category, status: t.status, bodyText: body, bodyParamCount: params.size };
  });
}

export async function sendTemplate(
  env: Env,
  to: string,
  template: string,
  lang: string,
  params: string[]
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const res = await fetch(graph(env, `${env.WHATSAPP_PHONE_NUMBER_ID}/messages`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: lang },
        ...(params.length ? { components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }] } : {}),
      },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { messages?: Array<{ id: string }>; error?: { message?: string; code?: number } };
  if (!res.ok || !json.messages?.[0]?.id) {
    return { ok: false, error: (json.error?.message || `HTTP ${res.status}`).slice(0, 300) };
  }
  return { ok: true, messageId: json.messages[0].id };
}

export async function verifyMetaSignature(env: Env, rawBody: ArrayBuffer, header: string | undefined): Promise<boolean> {
  if (!env.WHATSAPP_APP_SECRET || !header?.startsWith('sha256=')) return false;
  const expected = await hmacHex('SHA-256', env.WHATSAPP_APP_SECRET, rawBody);
  return safeEqual(header.slice(7), expected);
}

/* ---------- Broadcast worker ---------- */

function personalise(params: string[], name: string): string[] {
  const first = (name || '').trim().split(/\s+/)[0] || 'friend';
  return params.map((p) => p.replace(/\{\{\s*name\s*\}\}/gi, first).slice(0, 1024));
}

/**
 * Sends the next batch of pending broadcast messages. Safe to call concurrently:
 * rows are claimed atomically (pending → sending) before any message is sent.
 * Runs from the cron trigger every minute and right after a broadcast is created.
 */
export async function processBroadcastQueue(env: Env): Promise<{ processed: number }> {
  if (!whatsappConfigured(env)) return { processed: 0 };
  const batch = Math.min(Math.max(Number(env.BROADCAST_BATCH_SIZE) || 40, 1), 900);
  const now = nowIso();

  // Anything stuck in 'sending' for 15+ minutes was interrupted mid-send; don't risk a duplicate.
  await env.DB.prepare(
    `UPDATE broadcast_recipients SET status = 'failed', error = 'Interrupted while sending', updated_at = ?
     WHERE status = 'sending' AND updated_at < ?`
  )
    .bind(now, new Date(Date.now() - 15 * 60_000).toISOString())
    .run();

  const { results: claimed } = await env.DB.prepare(
    `UPDATE broadcast_recipients SET status = 'sending', updated_at = ?
     WHERE rowid IN (
       SELECT r.rowid FROM broadcast_recipients r JOIN broadcasts b ON b.id = r.broadcast_id
       WHERE r.status = 'pending' AND b.status IN ('queued', 'sending')
       ORDER BY b.created_at LIMIT ?
     )
     RETURNING broadcast_id, subscriber_id, phone, name`
  )
    .bind(now, batch)
    .all<{ broadcast_id: string; subscriber_id: string; phone: string; name: string }>();

  if (!claimed.length) {
    await finaliseBroadcasts(env);
    return { processed: 0 };
  }

  const ids = Array.from(new Set(claimed.map((r) => r.broadcast_id)));
  const { results: broadcasts } = await env.DB.prepare(
    `SELECT id, template_name, template_lang, body_params FROM broadcasts WHERE id IN (${ids.map(() => '?').join(',')})`
  )
    .bind(...ids)
    .all<{ id: string; template_name: string; template_lang: string; body_params: string }>();
  const byId = new Map(broadcasts.map((b) => [b.id, b]));

  await env.DB.prepare(`UPDATE broadcasts SET status = 'sending' WHERE status = 'queued' AND id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .run();

  for (const r of claimed) {
    const b = byId.get(r.broadcast_id);
    if (!b) continue;
    let params: string[] = [];
    try {
      params = JSON.parse(b.body_params);
    } catch {
      /* no params */
    }
    const result = await sendTemplate(env, r.phone, b.template_name, b.template_lang, personalise(params, r.name));
    const ts = nowIso();
    if (result.ok) {
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE broadcast_recipients SET status = 'sent', wa_message_id = ?, error = NULL, updated_at = ? WHERE broadcast_id = ? AND subscriber_id = ?`
        ).bind(result.messageId, ts, r.broadcast_id, r.subscriber_id),
        env.DB.prepare('UPDATE broadcasts SET sent = sent + 1 WHERE id = ?').bind(r.broadcast_id),
      ]);
    } else {
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE broadcast_recipients SET status = 'failed', error = ?, updated_at = ? WHERE broadcast_id = ? AND subscriber_id = ?`
        ).bind(result.error, ts, r.broadcast_id, r.subscriber_id),
        env.DB.prepare('UPDATE broadcasts SET failed = failed + 1 WHERE id = ?').bind(r.broadcast_id),
      ]);
    }
  }

  await finaliseBroadcasts(env);
  return { processed: claimed.length };
}

async function finaliseBroadcasts(env: Env) {
  await env.DB.prepare(
    `UPDATE broadcasts SET status = 'completed', completed_at = ?
     WHERE status IN ('queued', 'sending')
       AND NOT EXISTS (SELECT 1 FROM broadcast_recipients r WHERE r.broadcast_id = broadcasts.id AND r.status IN ('pending', 'sending'))`
  )
    .bind(nowIso())
    .run();
}

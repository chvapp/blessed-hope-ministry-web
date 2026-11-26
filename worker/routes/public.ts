import { Hono } from 'hono';
import type { AppBindings } from '../env.ts';
import { getAdmin } from '../lib/auth.ts';
import {
  type DevotionalRow,
  type EventRow,
  type SermonRow,
  type SubmissionRow,
  getSettings,
  mapDevotional,
  mapEvent,
  mapSermon,
  mapSubmission,
} from '../lib/data.ts';
import {
  getGlobalTimezoneComparison,
  resolveLocalDate,
  resolveLocalTimeLabel,
  resolveOffsetLabel,
  validateTimeZone,
} from '../lib/timezone.ts';
import { EMAIL_RE, newId, normalizePhone, nowIso, str } from '../lib/util.ts';

const SUBMISSION_TYPES = ['prayer', 'testimony', 'first_timer', 'academy', 'contact', 'salvation'] as const;

export const publicRoutes = new Hono<AppBindings>();

publicRoutes.get('/health', (c) => c.json({ ok: true }));

publicRoutes.get('/site', async (c) => {
  const [settings, featured, nextEvent] = await Promise.all([
    getSettings(c.env),
    c.env.DB.prepare('SELECT * FROM sermons WHERE is_featured = 1 ORDER BY preached_date DESC LIMIT 3').all<SermonRow>(),
    c.env.DB.prepare('SELECT * FROM events WHERE start_at >= ? ORDER BY is_countdown_target DESC, start_at ASC LIMIT 1')
      .bind(new Date(Date.now() - 6 * 3_600_000).toISOString())
      .first<EventRow>(),
  ]);
  c.header('Cache-Control', 'public, max-age=30');
  return c.json({
    settings,
    featuredSermons: featured.results.map(mapSermon),
    countdownEvent: nextEvent ? mapEvent(nextEvent) : null,
  });
});

/**
 * Today's devotional for the visitor's own calendar date. Devotionals dated after
 * the visitor's local date stay locked until midnight arrives in their timezone.
 */
publicRoutes.get('/devotionals/today', async (c) => {
  const timeZone = validateTimeZone(c.req.query('tz'));
  const now = new Date();
  const localDate = resolveLocalDate(timeZone, now);

  // Signed-in staff can preview future devotionals.
  let isStaff = false;
  try {
    isStaff = Boolean(await getAdmin(c.env, c.req.header('Authorization')));
  } catch {
    isStaff = false;
  }
  const ceiling = isStaff ? '9999-12-31' : localDate;

  const [archive, locked] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM devotionals WHERE status = 'published' AND publish_date <= ? ORDER BY publish_date DESC LIMIT 60`
    )
      .bind(ceiling)
      .all<DevotionalRow>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS n FROM devotionals WHERE status = 'published' AND publish_date > ?`)
      .bind(localDate)
      .first<{ n: number }>(),
  ]);
  const list = archive.results.map(mapDevotional);
  const today = list.find((d) => d.publishDate === localDate) || list.find((d) => d.publishDate <= localDate) || null;

  c.header('Cache-Control', 'private, max-age=60');
  return c.json({
    visitorTimeZone: timeZone,
    visitorLocalDate: localDate,
    visitorLocalTime: resolveLocalTimeLabel(timeZone, now),
    visitorOffset: resolveOffsetLabel(timeZone, now),
    exactDateMatch: Boolean(today && today.publishDate === localDate),
    todayDevotional: today,
    archive: list.filter((d) => d.publishDate <= localDate),
    nextLockedCount: locked?.n ?? 0,
    globalComparison: getGlobalTimezoneComparison(now),
  });
});

publicRoutes.get('/sermons', async (c) => {
  const type = c.req.query('type');
  const series = c.req.query('series');
  const q = str(c.req.query('q'), 100).toLowerCase();
  const where: string[] = [];
  const binds: unknown[] = [];
  if (type === 'video' || type === 'audio') {
    where.push('media_type = ?');
    binds.push(type);
  }
  if (series && series !== 'all') {
    where.push('series = ?');
    binds.push(series);
  }
  if (q) {
    where.push(`(LOWER(title) LIKE ? OR LOWER(speaker) LIKE ? OR LOWER(series) LIKE ? OR LOWER(category) LIKE ?)`);
    const like = `%${q.replace(/[%_]/g, '')}%`;
    binds.push(like, like, like, like);
  }
  const [list, allSeries] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM sermons ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY preached_date DESC LIMIT 200`)
      .bind(...binds)
      .all<SermonRow>(),
    c.env.DB.prepare(`SELECT DISTINCT series FROM sermons WHERE series != '' ORDER BY series`).all<{ series: string }>(),
  ]);
  return c.json({ sermons: list.results.map(mapSermon), seriesList: allSeries.results.map((r) => r.series) });
});

publicRoutes.get('/events', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM events ORDER BY start_at ASC LIMIT 200').all<EventRow>();
  return c.json({ events: results.map(mapEvent) });
});

publicRoutes.get('/testimonies', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM submissions WHERE type = 'testimony' AND is_approved = 1 ORDER BY created_at DESC LIMIT 60`
  ).all<SubmissionRow>();
  // Only publish what a testimony page needs, never contact details.
  return c.json({
    testimonies: results.map((r) => {
      const s = mapSubmission(r);
      return { id: s.id, type: s.type, fullName: s.fullName, subject: s.subject, message: s.message, createdAt: s.createdAt };
    }),
  });
});

publicRoutes.post('/community', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const type = str(b.type) as (typeof SUBMISSION_TYPES)[number];
  const fullName = str(b.fullName, 120);
  const email = str(b.email, 200);
  const phone = str(b.phone, 40);
  const subject = str(b.subject, 160);
  const message = str(b.message, 3000);
  if (str(b.website)) return c.json({ submission: { id: 'ok' } }, 201); // honeypot

  if (!SUBMISSION_TYPES.includes(type)) return c.json({ error: 'Invalid submission type.' }, 400);
  if (!fullName) return c.json({ error: 'Please provide your full name.' }, 400);
  if (!EMAIL_RE.test(email)) return c.json({ error: 'Please provide a valid email address.' }, 400);
  if (message.length < 5) return c.json({ error: 'Please enter a message (at least 5 characters).' }, 400);

  const id = newId('sub');
  const createdAt = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO submissions (id, type, full_name, email, phone, subject, message, is_approved, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'new', ?)`
  )
    .bind(id, type, fullName, email, phone, subject || `${type.replace('_', ' ')} enquiry`, message, createdAt)
    .run();
  return c.json({ submission: { id, type, createdAt } }, 201);
});

/** Website opt-in for WhatsApp updates (daily devotional, announcements). */
publicRoutes.post('/subscribe', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  if (str(b.website)) return c.json({ ok: true }); // honeypot
  const name = str(b.name, 120);
  const email = str(b.email, 200);
  const phone = normalizePhone(str(b.phone, 40), c.env.DEFAULT_COUNTRY_CODE || '234');
  if (b.consent !== true) return c.json({ error: 'Please confirm you would like to receive WhatsApp messages.' }, 400);
  if (!name) return c.json({ error: 'Please enter your name.' }, 400);
  if (!phone) return c.json({ error: 'Please enter a valid WhatsApp number, including country code.' }, 400);
  if (email && !EMAIL_RE.test(email)) return c.json({ error: 'Please enter a valid email address.' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO subscribers (id, name, phone, email, tags, whatsapp_opt_in, source, created_at, opted_out_at)
     VALUES (?, ?, ?, ?, 'website', 1, 'website', ?, NULL)
     ON CONFLICT(phone) DO UPDATE SET
       name = CASE WHEN excluded.name != '' THEN excluded.name ELSE subscribers.name END,
       email = CASE WHEN excluded.email != '' THEN excluded.email ELSE subscribers.email END,
       whatsapp_opt_in = 1, opted_out_at = NULL`
  )
    .bind(newId('subr'), name, phone, email, nowIso())
    .run();
  return c.json({ ok: true }, 201);
});

/** Public files uploaded by admins to R2 (sermon thumbnails, event posters). */
export async function serveMedia(c: { env: AppBindings['Bindings']; req: { path: string } }) {
  if (!c.env.MEDIA) return new Response('Not found', { status: 404 });
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ''));
  if (!/^uploads\/[\w./-]+$/.test(key)) return new Response('Not found', { status: 404 });
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(obj.body, { headers });
}

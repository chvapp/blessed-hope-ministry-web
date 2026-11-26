import { Hono } from 'hono';
import type { AppBindings, Role } from '../env.ts';
import { hashPassword, issueToken, requireRole, validatePassword, verifyPassword } from '../lib/auth.ts';
import {
  type BroadcastRow,
  type DevotionalRow,
  type DonationRow,
  type EventRow,
  type SermonRow,
  type SubmissionRow,
  type SubscriberRow,
  DEFAULT_SETTINGS,
  getSettings,
  mapBroadcast,
  mapDevotional,
  mapDonation,
  mapEvent,
  mapSermon,
  mapSubmission,
  mapSubscriber,
  saveSettings,
} from '../lib/data.ts';
import { applyVerification, verifyTransaction } from '../lib/paystack.ts';
import { getGlobalTimezoneComparison } from '../lib/timezone.ts';
import {
  EMAIL_RE,
  YMD_RE,
  csvEscape,
  isAssetOrUrl,
  isHttpUrl,
  newId,
  normalizePhone,
  normalizeTags,
  nowIso,
  safeEqual,
  str,
} from '../lib/util.ts';
import { listTemplates, processBroadcastQueue, whatsappConfigured } from '../lib/whatsapp.ts';

export const adminRoutes = new Hono<AppBindings>();

const ROLES: Role[] = ['super_admin', 'admin', 'editor'];
const body = async (c: { req: { json: () => Promise<unknown> } }) =>
  ((await c.req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;

/* =========================== Auth =========================== */

adminRoutes.get('/auth/status', async (c) => {
  const row = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM admin_users').first<{ n: number }>();
  return c.json({ needsSetup: (row?.n ?? 0) === 0, setupEnabled: Boolean(c.env.ADMIN_SETUP_TOKEN) });
});

/** First-run: create the first super admin. Requires the ADMIN_SETUP_TOKEN secret. */
adminRoutes.post('/auth/setup', async (c) => {
  const b = await body(c);
  const expected = c.env.ADMIN_SETUP_TOKEN?.trim();
  if (!expected) return c.json({ error: 'Setup is disabled. Set the ADMIN_SETUP_TOKEN secret first.' }, 403);
  if (!safeEqual(str(b.setupToken, 200), expected)) return c.json({ error: 'Invalid setup token.' }, 403);
  const existing = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM admin_users').first<{ n: number }>();
  if ((existing?.n ?? 0) > 0) return c.json({ error: 'Setup has already been completed. Please sign in.' }, 409);

  const name = str(b.name, 120);
  const email = str(b.email, 200).toLowerCase();
  const password = String(b.password ?? '');
  if (!name || !EMAIL_RE.test(email)) return c.json({ error: 'Please enter your name and a valid email.' }, 400);
  const pwError = validatePassword(password);
  if (pwError) return c.json({ error: pwError }, 400);

  const id = newId('usr');
  await c.env.DB.prepare(
    `INSERT INTO admin_users (id, email, name, password_hash, role, created_at, last_login_at) VALUES (?, ?, ?, ?, 'super_admin', ?, ?)`
  )
    .bind(id, email, name, await hashPassword(password), nowIso(), nowIso())
    .run();
  return c.json({ token: await issueToken(c.env, id, 1), user: { id, email, name, role: 'super_admin' } });
});

adminRoutes.post('/auth/login', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (c.env.LOGIN_LIMITER) {
    const { success } = await c.env.LOGIN_LIMITER.limit({ key: `login:${ip}` });
    if (!success) return c.json({ error: 'Too many sign-in attempts. Please wait a minute and try again.' }, 429);
  }
  const b = await body(c);
  const email = str(b.email, 200).toLowerCase();
  const password = String(b.password ?? '');
  const user = await c.env.DB.prepare('SELECT * FROM admin_users WHERE email = ?').bind(email).first<{
    id: string;
    email: string;
    name: string;
    role: Role;
    password_hash: string;
    is_active: number;
    session_version: number;
  }>();
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, user?.password_hash || 'pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  if (!user || !ok || !user.is_active) return c.json({ error: 'Incorrect email or password.' }, 401);

  await c.env.DB.prepare('UPDATE admin_users SET last_login_at = ? WHERE id = ?').bind(nowIso(), user.id).run();
  try {
    return c.json({
      token: await issueToken(c.env, user.id, user.session_version),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Admin sign-in is not configured on the server (SESSION_SECRET).' }, 500);
  }
});

adminRoutes.get('/auth/me', requireRole('editor'), (c) => c.json({ user: c.get('admin') }));

adminRoutes.post('/auth/password', requireRole('editor'), async (c) => {
  const b = await body(c);
  const me = c.get('admin');
  const row = await c.env.DB.prepare('SELECT password_hash, session_version FROM admin_users WHERE id = ?')
    .bind(me.id)
    .first<{ password_hash: string; session_version: number }>();
  if (!row || !(await verifyPassword(String(b.currentPassword ?? ''), row.password_hash))) {
    return c.json({ error: 'Your current password is incorrect.' }, 400);
  }
  const pwError = validatePassword(String(b.newPassword ?? ''));
  if (pwError) return c.json({ error: pwError }, 400);
  const nextVersion = row.session_version + 1; // signs out other devices
  await c.env.DB.prepare('UPDATE admin_users SET password_hash = ?, session_version = ? WHERE id = ?')
    .bind(await hashPassword(String(b.newPassword)), nextVersion, me.id)
    .run();
  return c.json({ token: await issueToken(c.env, me.id, nextVersion) });
});

/* =========================== Team (super admin) =========================== */

adminRoutes.get('/users', requireRole('super_admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, email, name, role, is_active, last_login_at, created_at FROM admin_users ORDER BY created_at'
  ).all<{ id: string; email: string; name: string; role: Role; is_active: number; last_login_at: string | null; created_at: string }>();
  return c.json({
    users: results.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, isActive: Boolean(u.is_active), lastLoginAt: u.last_login_at, createdAt: u.created_at })),
  });
});

adminRoutes.post('/users', requireRole('super_admin'), async (c) => {
  const b = await body(c);
  const name = str(b.name, 120);
  const email = str(b.email, 200).toLowerCase();
  const role = str(b.role) as Role;
  const password = String(b.password ?? '');
  if (!name || !EMAIL_RE.test(email)) return c.json({ error: 'Name and a valid email are required.' }, 400);
  if (!ROLES.includes(role)) return c.json({ error: 'Invalid role.' }, 400);
  const pwError = validatePassword(password);
  if (pwError) return c.json({ error: pwError }, 400);
  const exists = await c.env.DB.prepare('SELECT 1 FROM admin_users WHERE email = ?').bind(email).first();
  if (exists) return c.json({ error: 'A team member with that email already exists.' }, 409);
  const id = newId('usr');
  await c.env.DB.prepare(`INSERT INTO admin_users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, email, name, await hashPassword(password), role, nowIso())
    .run();
  return c.json({ user: { id, email, name, role, isActive: true } }, 201);
});

adminRoutes.put('/users/:id', requireRole('super_admin'), async (c) => {
  const id = c.req.param('id');
  const b = await body(c);
  const me = c.get('admin');
  if (id === me.id && (b.role !== undefined || b.isActive === false)) {
    return c.json({ error: 'You cannot change your own role or deactivate yourself.' }, 400);
  }
  const sets: string[] = [];
  const binds: unknown[] = [];
  if (b.role !== undefined) {
    if (!ROLES.includes(b.role as Role)) return c.json({ error: 'Invalid role.' }, 400);
    sets.push('role = ?');
    binds.push(b.role);
  }
  if (typeof b.isActive === 'boolean') {
    sets.push('is_active = ?', 'session_version = session_version + 1');
    binds.push(b.isActive ? 1 : 0);
  }
  if (b.password) {
    const pwError = validatePassword(String(b.password));
    if (pwError) return c.json({ error: pwError }, 400);
    sets.push('password_hash = ?', 'session_version = session_version + 1');
    binds.push(await hashPassword(String(b.password)));
  }
  if (!sets.length) return c.json({ error: 'Nothing to update.' }, 400);
  const res = await c.env.DB.prepare(`UPDATE admin_users SET ${Array.from(new Set(sets)).join(', ')} WHERE id = ?`)
    .bind(...binds, id)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Team member not found.' }, 404);
  return c.json({ ok: true });
});

adminRoutes.delete('/users/:id', requireRole('super_admin'), async (c) => {
  const id = c.req.param('id');
  if (id === c.get('admin').id) return c.json({ error: 'You cannot remove yourself.' }, 400);
  const res = await c.env.DB.prepare('DELETE FROM admin_users WHERE id = ?').bind(id).run();
  if (!res.meta.changes) return c.json({ error: 'Team member not found.' }, 404);
  return c.json({ deleted: true });
});

/* =========================== Overview =========================== */

adminRoutes.get('/overview', requireRole('editor'), async (c) => {
  const db = c.env.DB;
  const today = new Date().toISOString().slice(0, 10);
  const [counts, totals, recent, upcoming, settings] = await Promise.all([
    db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM devotionals WHERE status = 'published') AS published_devotionals,
          (SELECT COUNT(*) FROM devotionals WHERE status = 'draft') AS draft_devotionals,
          (SELECT COUNT(*) FROM devotionals WHERE status = 'published' AND publish_date >= ?) AS scheduled_devotionals,
          (SELECT MAX(publish_date) FROM devotionals WHERE status = 'published') AS last_scheduled_date,
          (SELECT COUNT(*) FROM sermons) AS sermons,
          (SELECT COUNT(*) FROM events WHERE start_at >= ?) AS upcoming_events,
          (SELECT COUNT(*) FROM submissions WHERE status = 'new') AS pending_submissions,
          (SELECT COUNT(*) FROM donations WHERE status = 'success') AS verified_donations,
          (SELECT COUNT(*) FROM subscribers WHERE whatsapp_opt_in = 1 AND opted_out_at IS NULL) AS subscribers`
      )
      .bind(today, nowIso())
      .first<Record<string, number | string | null>>(),
    db
      .prepare(`SELECT currency, SUM(amount_minor) AS total FROM donations WHERE status = 'success' GROUP BY currency`)
      .all<{ currency: string; total: number }>(),
    db.prepare('SELECT * FROM donations ORDER BY created_at DESC LIMIT 6').all<DonationRow>(),
    db.prepare('SELECT * FROM devotionals WHERE publish_date >= ? ORDER BY publish_date ASC LIMIT 7').bind(today).all<DevotionalRow>(),
    getSettings(c.env),
  ]);
  const totalsByCurrency: Record<string, number> = { NGN: 0, USD: 0 };
  for (const t of totals.results) totalsByCurrency[t.currency] = (t.total || 0) / 100;
  return c.json({
    counts: {
      publishedDevotionals: counts?.published_devotionals ?? 0,
      draftDevotionals: counts?.draft_devotionals ?? 0,
      scheduledDevotionals: counts?.scheduled_devotionals ?? 0,
      lastScheduledDate: counts?.last_scheduled_date ?? null,
      sermons: counts?.sermons ?? 0,
      events: counts?.upcoming_events ?? 0,
      pendingSubmissions: counts?.pending_submissions ?? 0,
      verifiedDonations: counts?.verified_donations ?? 0,
      subscribers: counts?.subscribers ?? 0,
    },
    totalsByCurrency,
    recentDonations: recent.results.map(mapDonation),
    upcomingDevotionals: upcoming.results.map(mapDevotional),
    globalComparison: getGlobalTimezoneComparison(),
    settings,
  });
});

/* =========================== Devotionals =========================== */

function parseDevotional(b: Record<string, unknown>) {
  const prayerPoints = Array.isArray(b.prayerPoints)
    ? b.prayerPoints.map((p) => str(p, 500)).filter(Boolean)
    : String(b.prayerPoints ?? '')
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);
  const d = {
    publishDate: str(b.publishDate, 10),
    title: str(b.title, 200),
    scriptureRef: str(b.scriptureRef, 120),
    memoryVerse: str(b.memoryVerse, 1000),
    focus: str(b.propheticFocus, 200),
    body: str(b.body, 20000),
    prayerPoints: prayerPoints.slice(0, 20),
    author: str(b.author, 120),
    status: b.status === 'draft' ? 'draft' : 'published',
  };
  if (!YMD_RE.test(d.publishDate)) return { error: 'Publish date must be YYYY-MM-DD.' } as const;
  if (!d.title || !d.scriptureRef || !d.body) return { error: 'Title, scripture reference and body are required.' } as const;
  return { value: d } as const;
}

adminRoutes.get('/devotionals', requireRole('editor'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM devotionals ORDER BY publish_date DESC LIMIT 500').all<DevotionalRow>();
  return c.json({ devotionals: results.map(mapDevotional), globalComparison: getGlobalTimezoneComparison() });
});

adminRoutes.post('/devotionals', requireRole('editor'), async (c) => {
  const parsed = parseDevotional(await body(c));
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);
  const d = parsed.value;
  const clash = await c.env.DB.prepare('SELECT 1 FROM devotionals WHERE publish_date = ?').bind(d.publishDate).first();
  if (clash) return c.json({ error: `A devotional is already scheduled for ${d.publishDate}.` }, 409);
  const id = newId('dev');
  const ts = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO devotionals (id, publish_date, title, scripture_ref, memory_verse, focus, body, prayer_points, author, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, d.publishDate, d.title, d.scriptureRef, d.memoryVerse, d.focus, d.body, JSON.stringify(d.prayerPoints), d.author, d.status, ts, ts)
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM devotionals WHERE id = ?').bind(id).first<DevotionalRow>();
  return c.json({ devotional: row && mapDevotional(row) }, 201);
});

adminRoutes.put('/devotionals/:id', requireRole('editor'), async (c) => {
  const id = c.req.param('id');
  const parsed = parseDevotional(await body(c));
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);
  const d = parsed.value;
  const clash = await c.env.DB.prepare('SELECT 1 FROM devotionals WHERE publish_date = ? AND id != ?').bind(d.publishDate, id).first();
  if (clash) return c.json({ error: `Another devotional already uses ${d.publishDate}.` }, 409);
  const res = await c.env.DB.prepare(
    `UPDATE devotionals SET publish_date = ?, title = ?, scripture_ref = ?, memory_verse = ?, focus = ?, body = ?, prayer_points = ?, author = ?, status = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(d.publishDate, d.title, d.scriptureRef, d.memoryVerse, d.focus, d.body, JSON.stringify(d.prayerPoints), d.author, d.status, nowIso(), id)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Devotional not found.' }, 404);
  const row = await c.env.DB.prepare('SELECT * FROM devotionals WHERE id = ?').bind(id).first<DevotionalRow>();
  return c.json({ devotional: row && mapDevotional(row) });
});

adminRoutes.delete('/devotionals/:id', requireRole('editor'), async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM devotionals WHERE id = ?').bind(c.req.param('id')).run();
  if (!res.meta.changes) return c.json({ error: 'Devotional not found.' }, 404);
  return c.json({ deleted: true });
});

/* =========================== Sermons =========================== */

function parseSermon(b: Record<string, unknown>) {
  const s = {
    title: str(b.title, 200),
    speaker: str(b.speaker, 120),
    series: str(b.series, 120),
    category: str(b.category, 120),
    mediaType: b.mediaType === 'audio' ? 'audio' : 'video',
    mediaUrl: str(b.mediaUrl, 500),
    thumbnailUrl: str(b.thumbnailUrl, 500),
    duration: str(b.duration, 20),
    preachedDate: str(b.preachedDate, 10),
    summary: str(b.summary, 2000),
    isFeatured: b.isFeatured ? 1 : 0,
  };
  if (!s.title || !s.speaker || !YMD_RE.test(s.preachedDate)) return { error: 'Title, speaker and date (YYYY-MM-DD) are required.' } as const;
  if (!isHttpUrl(s.mediaUrl) || !isAssetOrUrl(s.thumbnailUrl)) return { error: 'Media and thumbnail must be valid links.' } as const;
  return { value: s } as const;
}

adminRoutes.get('/sermons', requireRole('editor'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM sermons ORDER BY preached_date DESC LIMIT 500').all<SermonRow>();
  return c.json({ sermons: results.map(mapSermon) });
});

adminRoutes.post('/sermons', requireRole('editor'), async (c) => {
  const parsed = parseSermon(await body(c));
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);
  const s = parsed.value;
  const id = newId('ser');
  await c.env.DB.prepare(
    `INSERT INTO sermons (id, title, speaker, series, category, media_type, media_url, thumbnail_url, duration, preached_date, summary, is_featured, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, s.title, s.speaker, s.series, s.category, s.mediaType, s.mediaUrl, s.thumbnailUrl, s.duration, s.preachedDate, s.summary, s.isFeatured, nowIso())
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM sermons WHERE id = ?').bind(id).first<SermonRow>();
  return c.json({ sermon: row && mapSermon(row) }, 201);
});

adminRoutes.put('/sermons/:id', requireRole('editor'), async (c) => {
  const parsed = parseSermon(await body(c));
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);
  const s = parsed.value;
  const id = c.req.param('id');
  const res = await c.env.DB.prepare(
    `UPDATE sermons SET title = ?, speaker = ?, series = ?, category = ?, media_type = ?, media_url = ?, thumbnail_url = ?, duration = ?, preached_date = ?, summary = ?, is_featured = ?
     WHERE id = ?`
  )
    .bind(s.title, s.speaker, s.series, s.category, s.mediaType, s.mediaUrl, s.thumbnailUrl, s.duration, s.preachedDate, s.summary, s.isFeatured, id)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Sermon not found.' }, 404);
  const row = await c.env.DB.prepare('SELECT * FROM sermons WHERE id = ?').bind(id).first<SermonRow>();
  return c.json({ sermon: row && mapSermon(row) });
});

adminRoutes.delete('/sermons/:id', requireRole('editor'), async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM sermons WHERE id = ?').bind(c.req.param('id')).run();
  if (!res.meta.changes) return c.json({ error: 'Sermon not found.' }, 404);
  return c.json({ deleted: true });
});

/* =========================== Events =========================== */

function parseEvent(b: Record<string, unknown>) {
  const startAt = new Date(str(b.startAt, 40));
  const e = {
    title: str(b.title, 200),
    category: (['service', 'convention', 'academy'].includes(String(b.category)) ? b.category : 'service') as string,
    scheduleLabel: str(b.scheduleLabel, 200),
    startAt: Number.isNaN(startAt.getTime()) ? '' : startAt.toISOString(),
    location: str(b.location, 200),
    description: str(b.description, 3000),
    imageUrl: str(b.imageUrl, 500),
    isCountdownTarget: b.isCountdownTarget ? 1 : 0,
  };
  if (!e.title || !e.startAt) return { error: 'Title and a valid start date/time are required.' } as const;
  if (!isAssetOrUrl(e.imageUrl)) return { error: 'Image must be a valid link.' } as const;
  return { value: e } as const;
}

async function saveEvent(c: { env: AppBindings['Bindings'] }, id: string | null, e: NonNullable<ReturnType<typeof parseEvent>['value']>) {
  const db = c.env.DB;
  const stmts: D1PreparedStatement[] = [];
  if (e.isCountdownTarget) stmts.push(db.prepare('UPDATE events SET is_countdown_target = 0'));
  if (id) {
    stmts.push(
      db
        .prepare(
          `UPDATE events SET title = ?, category = ?, schedule_label = ?, start_at = ?, location = ?, description = ?, image_url = ?, is_countdown_target = ? WHERE id = ?`
        )
        .bind(e.title, e.category, e.scheduleLabel, e.startAt, e.location, e.description, e.imageUrl, e.isCountdownTarget, id)
    );
  } else {
    id = newId('evt');
    stmts.push(
      db
        .prepare(
          `INSERT INTO events (id, title, category, schedule_label, start_at, location, description, image_url, is_countdown_target, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, e.title, e.category, e.scheduleLabel, e.startAt, e.location, e.description, e.imageUrl, e.isCountdownTarget, nowIso())
    );
  }
  await db.batch(stmts);
  return db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<EventRow>();
}

adminRoutes.get('/events', requireRole('editor'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM events ORDER BY start_at DESC LIMIT 500').all<EventRow>();
  return c.json({ events: results.map(mapEvent) });
});

adminRoutes.post('/events', requireRole('editor'), async (c) => {
  const parsed = parseEvent(await body(c));
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);
  const row = await saveEvent(c, null, parsed.value);
  return c.json({ event: row && mapEvent(row) }, 201);
});

adminRoutes.put('/events/:id', requireRole('editor'), async (c) => {
  const parsed = parseEvent(await body(c));
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);
  const exists = await c.env.DB.prepare('SELECT 1 FROM events WHERE id = ?').bind(c.req.param('id')).first();
  if (!exists) return c.json({ error: 'Event not found.' }, 404);
  const row = await saveEvent(c, c.req.param('id') ?? null, parsed.value);
  return c.json({ event: row && mapEvent(row) });
});

adminRoutes.delete('/events/:id', requireRole('editor'), async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(c.req.param('id')).run();
  if (!res.meta.changes) return c.json({ error: 'Event not found.' }, 404);
  return c.json({ deleted: true });
});

/* =========================== Giving =========================== */

adminRoutes.get('/donations', requireRole('admin'), async (c) => {
  const status = c.req.query('status');
  const where = status && ['pending', 'success', 'failed'].includes(status) ? 'WHERE status = ?' : '';
  const stmt = c.env.DB.prepare(`SELECT * FROM donations ${where} ORDER BY created_at DESC LIMIT 1000`);
  const { results } = await (where ? stmt.bind(status) : stmt).all<DonationRow>();
  return c.json({ donations: results.map(mapDonation), paystackConfigured: Boolean(c.env.PAYSTACK_SECRET_KEY?.trim()) });
});

adminRoutes.get('/donations/export', requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM donations ORDER BY created_at DESC').all<DonationRow>();
  const header = ['Date', 'Reference', 'Name', 'Email', 'Fund', 'Currency', 'Amount', 'Status', 'Paid at', 'Gateway response'];
  const lines = results.map((r) =>
    [r.created_at, r.reference, r.donor_name, r.donor_email, r.category, r.currency, (r.amount_minor / 100).toFixed(2), r.status, r.paid_at ?? '', r.gateway_response]
      .map(csvEscape)
      .join(',')
  );
  return new Response([header.join(','), ...lines].join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="giving-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});

adminRoutes.post('/donations/:reference/verify', requireRole('admin'), async (c) => {
  const secretKey = c.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) return c.json({ error: 'PAYSTACK_SECRET_KEY is not configured.' }, 503);
  const reference = c.req.param('reference') ?? '';
  try {
    const row = await applyVerification(c.env, reference, await verifyTransaction(secretKey, reference));
    if (!row) return c.json({ error: 'Donation not found.' }, 404);
    return c.json({ donation: mapDonation(row) });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Paystack verification failed.' }, 502);
  }
});

/* =========================== Community inbox =========================== */

adminRoutes.get('/community', requireRole('editor'), async (c) => {
  const [subs, settings] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 1000').all<SubmissionRow>(),
    getSettings(c.env),
  ]);
  return c.json({ submissions: subs.results.map(mapSubmission), settings });
});

adminRoutes.patch('/community/:id', requireRole('editor'), async (c) => {
  const b = await body(c);
  const sets: string[] = [];
  const binds: unknown[] = [];
  if (typeof b.isApproved === 'boolean') {
    sets.push('is_approved = ?');
    binds.push(b.isApproved ? 1 : 0);
  }
  if (b.status === 'new' || b.status === 'reviewed') {
    sets.push('status = ?');
    binds.push(b.status);
  }
  if (!sets.length) return c.json({ error: 'Nothing to update.' }, 400);
  const id = c.req.param('id');
  const res = await c.env.DB.prepare(`UPDATE submissions SET ${sets.join(', ')} WHERE id = ?`).bind(...binds, id).run();
  if (!res.meta.changes) return c.json({ error: 'Submission not found.' }, 404);
  const row = await c.env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).first<SubmissionRow>();
  return c.json({ submission: row && mapSubmission(row) });
});

adminRoutes.delete('/community/:id', requireRole('editor'), async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(c.req.param('id')).run();
  if (!res.meta.changes) return c.json({ error: 'Submission not found.' }, 404);
  return c.json({ deleted: true });
});

/* =========================== Settings =========================== */

adminRoutes.get('/settings', requireRole('editor'), async (c) => c.json({ settings: await getSettings(c.env) }));

adminRoutes.put('/settings', requireRole('admin'), async (c) => {
  const b = await body(c);
  const patch: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (key === 'updatedAt' || !(key in b)) continue;
    patch[key] = typeof def === 'boolean' ? Boolean(b[key]) : str(b[key], 2000);
  }
  const urls = ['liveStreamEnglishUrl', 'liveStreamFrenchUrl', 'liveStreamYorubaUrl', 'radioStreamUrl'];
  if (urls.some((k) => typeof patch[k] === 'string' && !isHttpUrl(patch[k] as string))) {
    return c.json({ error: 'Stream links must start with http:// or https://.' }, 400);
  }
  if (typeof patch.contactEmail === 'string' && patch.contactEmail && !EMAIL_RE.test(patch.contactEmail)) {
    return c.json({ error: 'Please enter a valid contact email.' }, 400);
  }
  return c.json({ settings: await saveSettings(c.env, patch) });
});

/* =========================== Members / subscribers =========================== */

adminRoutes.get('/subscribers', requireRole('admin'), async (c) => {
  const q = str(c.req.query('q'), 100).toLowerCase().replace(/[%_]/g, '');
  const tag = normalizeTags(c.req.query('tag') || '');
  const page = Math.max(1, Number(c.req.query('page')) || 1);
  const pageSize = 50;
  const where: string[] = [];
  const binds: unknown[] = [];
  if (q) {
    where.push('(LOWER(name) LIKE ? OR phone LIKE ? OR LOWER(email) LIKE ?)');
    binds.push(`%${q}%`, `%${q.replace(/\D/g, '') || q}%`, `%${q}%`);
  }
  if (tag) {
    where.push(`(',' || tags || ',') LIKE ?`);
    binds.push(`%,${tag},%`);
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows, total, tagsRes] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM subscribers ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...binds, pageSize, (page - 1) * pageSize)
      .all<SubscriberRow>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS n, SUM(CASE WHEN whatsapp_opt_in = 1 AND opted_out_at IS NULL THEN 1 ELSE 0 END) AS opted FROM subscribers ${w}`)
      .bind(...binds)
      .first<{ n: number; opted: number }>(),
    c.env.DB.prepare(`SELECT tags FROM subscribers WHERE tags != ''`).all<{ tags: string }>(),
  ]);
  const tagCounts: Record<string, number> = {};
  for (const r of tagsRes.results) for (const t of r.tags.split(',')) if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
  return c.json({
    subscribers: rows.results.map(mapSubscriber),
    total: total?.n ?? 0,
    optedIn: total?.opted ?? 0,
    page,
    pageSize,
    tags: Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
  });
});

adminRoutes.post('/subscribers', requireRole('admin'), async (c) => {
  const b = await body(c);
  const phone = normalizePhone(str(b.phone, 40), c.env.DEFAULT_COUNTRY_CODE || '234');
  if (!phone) return c.json({ error: 'Please enter a valid phone number.' }, 400);
  const email = str(b.email, 200);
  if (email && !EMAIL_RE.test(email)) return c.json({ error: 'Please enter a valid email.' }, 400);
  const exists = await c.env.DB.prepare('SELECT 1 FROM subscribers WHERE phone = ?').bind(phone).first();
  if (exists) return c.json({ error: 'A member with that phone number already exists.' }, 409);
  const id = newId('subr');
  await c.env.DB.prepare(
    `INSERT INTO subscribers (id, name, phone, email, tags, whatsapp_opt_in, source, created_at) VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)`
  )
    .bind(id, str(b.name, 120), phone, email, normalizeTags(b.tags), b.whatsappOptIn === false ? 0 : 1, nowIso())
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM subscribers WHERE id = ?').bind(id).first<SubscriberRow>();
  return c.json({ subscriber: row && mapSubscriber(row) }, 201);
});

adminRoutes.put('/subscribers/:id', requireRole('admin'), async (c) => {
  const b = await body(c);
  const id = c.req.param('id');
  const phone = normalizePhone(str(b.phone, 40), c.env.DEFAULT_COUNTRY_CODE || '234');
  if (!phone) return c.json({ error: 'Please enter a valid phone number.' }, 400);
  const clash = await c.env.DB.prepare('SELECT 1 FROM subscribers WHERE phone = ? AND id != ?').bind(phone, id).first();
  if (clash) return c.json({ error: 'Another member already uses that phone number.' }, 409);
  const optIn = b.whatsappOptIn !== false;
  const res = await c.env.DB.prepare(
    `UPDATE subscribers SET name = ?, phone = ?, email = ?, tags = ?, whatsapp_opt_in = ?,
       opted_out_at = CASE WHEN ? = 1 THEN NULL ELSE COALESCE(opted_out_at, ?) END
     WHERE id = ?`
  )
    .bind(str(b.name, 120), phone, str(b.email, 200), normalizeTags(b.tags), optIn ? 1 : 0, optIn ? 1 : 0, nowIso(), id)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Member not found.' }, 404);
  const row = await c.env.DB.prepare('SELECT * FROM subscribers WHERE id = ?').bind(id).first<SubscriberRow>();
  return c.json({ subscriber: row && mapSubscriber(row) });
});

adminRoutes.delete('/subscribers/:id', requireRole('admin'), async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM subscribers WHERE id = ?').bind(c.req.param('id')).run();
  if (!res.meta.changes) return c.json({ error: 'Member not found.' }, 404);
  return c.json({ deleted: true });
});

/** Bulk import: rows of { name, phone, email?, tags? } parsed from a CSV in the browser. */
adminRoutes.post('/subscribers/import', requireRole('admin'), async (c) => {
  const b = await body(c);
  const rows = Array.isArray(b.rows) ? (b.rows as Array<Record<string, unknown>>).slice(0, 5000) : [];
  const extraTags = normalizeTags(b.tags);
  const cc = c.env.DEFAULT_COUNTRY_CODE || '234';
  const invalid: number[] = [];
  const stmts: D1PreparedStatement[] = [];
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    const phone = normalizePhone(str(r.phone, 40), cc);
    if (!phone || seen.has(phone)) {
      if (!phone) invalid.push(i + 1);
      return;
    }
    seen.add(phone);
    const tags = normalizeTags([str(r.tags, 300), extraTags].filter(Boolean).join(','));
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO subscribers (id, name, phone, email, tags, whatsapp_opt_in, source, created_at)
         VALUES (?, ?, ?, ?, ?, 1, 'import', ?)
         ON CONFLICT(phone) DO UPDATE SET
           name = CASE WHEN excluded.name != '' THEN excluded.name ELSE subscribers.name END,
           email = CASE WHEN excluded.email != '' THEN excluded.email ELSE subscribers.email END,
           tags = CASE WHEN subscribers.tags = '' THEN excluded.tags WHEN excluded.tags = '' THEN subscribers.tags ELSE subscribers.tags || ',' || excluded.tags END`
      ).bind(newId('subr'), str(r.name, 120), phone, str(r.email, 200), tags, nowIso())
    );
  });
  for (let i = 0; i < stmts.length; i += 100) await c.env.DB.batch(stmts.slice(i, i + 100));
  // Tidy duplicate tags produced by merging.
  if (stmts.length) {
    const { results } = await c.env.DB.prepare(`SELECT id, tags FROM subscribers WHERE tags LIKE '%,%'`).all<{ id: string; tags: string }>();
    const fixes = results
      .map((r) => ({ id: r.id, tags: normalizeTags(r.tags) }))
      .filter((r, i) => r.tags !== results[i].tags)
      .map((r) => c.env.DB.prepare('UPDATE subscribers SET tags = ? WHERE id = ?').bind(r.tags, r.id));
    for (let i = 0; i < fixes.length; i += 100) await c.env.DB.batch(fixes.slice(i, i + 100));
  }
  return c.json({ imported: stmts.length, invalidRows: invalid.slice(0, 50), invalidCount: invalid.length });
});

/* =========================== WhatsApp broadcasts =========================== */

adminRoutes.get('/whatsapp/status', requireRole('admin'), (c) =>
  c.json({
    configured: whatsappConfigured(c.env),
    templatesAvailable: Boolean(c.env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    webhookConfigured: Boolean(c.env.WHATSAPP_APP_SECRET && c.env.WHATSAPP_VERIFY_TOKEN),
  })
);

adminRoutes.get('/whatsapp/templates', requireRole('admin'), async (c) => {
  try {
    const templates = await listTemplates(c.env);
    return c.json({ templates: templates.filter((t) => t.status === 'APPROVED') });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Unable to load templates.' }, 502);
  }
});

adminRoutes.get('/broadcasts', requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 100').all<BroadcastRow>();
  return c.json({ broadcasts: results.map(mapBroadcast) });
});

adminRoutes.get('/broadcasts/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const b = await c.env.DB.prepare('SELECT * FROM broadcasts WHERE id = ?').bind(id).first<BroadcastRow>();
  if (!b) return c.json({ error: 'Broadcast not found.' }, 404);
  const [stats, failures] = await Promise.all([
    c.env.DB.prepare('SELECT status, COUNT(*) AS n FROM broadcast_recipients WHERE broadcast_id = ? GROUP BY status').bind(id).all<{ status: string; n: number }>(),
    c.env.DB.prepare(`SELECT name, phone, error FROM broadcast_recipients WHERE broadcast_id = ? AND status = 'failed' LIMIT 50`)
      .bind(id)
      .all<{ name: string; phone: string; error: string }>(),
  ]);
  return c.json({
    broadcast: mapBroadcast(b),
    statusCounts: Object.fromEntries(stats.results.map((s) => [s.status, s.n])),
    failures: failures.results,
  });
});

adminRoutes.post('/broadcasts/preview-audience', requireRole('admin'), async (c) => {
  const tag = normalizeTags((await body(c)).audienceTag || '');
  const row = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM subscribers WHERE whatsapp_opt_in = 1 AND opted_out_at IS NULL ${tag ? `AND (',' || tags || ',') LIKE ?` : ''}`
  )
    .bind(...(tag ? [`%,${tag},%`] : []))
    .first<{ n: number }>();
  return c.json({ recipients: row?.n ?? 0 });
});

adminRoutes.post('/broadcasts', requireRole('admin'), async (c) => {
  if (!whatsappConfigured(c.env)) return c.json({ error: 'WhatsApp is not configured yet. Add the WhatsApp secrets first.' }, 503);
  const b = await body(c);
  const templateName = str(b.templateName, 512);
  const templateLang = str(b.templateLang, 20) || 'en';
  const params = Array.isArray(b.bodyParams) ? b.bodyParams.map((p) => str(p, 1024)) : [];
  const audienceTag = normalizeTags(b.audienceTag || '');
  if (!/^[a-z0-9_]+$/.test(templateName)) return c.json({ error: 'Please choose an approved message template.' }, 400);
  if (params.some((p) => !p)) return c.json({ error: 'Please fill in every template variable.' }, 400);

  const id = newId('bc');
  const ts = nowIso();
  const me = c.get('admin');
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO broadcasts (id, channel, template_name, template_lang, body_params, audience_tag, preview_text, status, created_by, created_at)
       VALUES (?, 'whatsapp', ?, ?, ?, ?, ?, 'queued', ?, ?)`
    ).bind(id, templateName, templateLang, JSON.stringify(params), audienceTag, str(b.previewText, 2000), me.name || me.email, ts),
    c.env.DB.prepare(
      `INSERT INTO broadcast_recipients (broadcast_id, subscriber_id, phone, name, status, updated_at)
       SELECT ?, id, phone, name, 'pending', ? FROM subscribers
       WHERE whatsapp_opt_in = 1 AND opted_out_at IS NULL ${audienceTag ? `AND (',' || tags || ',') LIKE ?` : ''}`
    ).bind(id, ts, ...(audienceTag ? [`%,${audienceTag},%`] : [])),
    c.env.DB.prepare('UPDATE broadcasts SET total = (SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = ?) WHERE id = ?').bind(id, id),
  ]);
  const row = await c.env.DB.prepare('SELECT * FROM broadcasts WHERE id = ?').bind(id).first<BroadcastRow>();
  if (row && row.total === 0) {
    await c.env.DB.prepare(`UPDATE broadcasts SET status = 'completed', completed_at = ? WHERE id = ?`).bind(ts, id).run();
    return c.json({ error: 'No opted-in members match that audience.' }, 400);
  }
  // Start sending immediately; the cron trigger picks up anything left.
  c.executionCtx.waitUntil(processBroadcastQueue(c.env).catch((e) => console.error('Broadcast send failed', e)));
  return c.json({ broadcast: row && mapBroadcast(row) }, 201);
});

adminRoutes.post('/broadcasts/:id/cancel', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const ts = nowIso();
  const res = await c.env.DB.prepare(`UPDATE broadcasts SET status = 'cancelled', completed_at = ? WHERE id = ? AND status IN ('queued', 'sending')`)
    .bind(ts, id)
    .run();
  if (!res.meta.changes) return c.json({ error: 'This broadcast can no longer be cancelled.' }, 409);
  await c.env.DB.prepare(`UPDATE broadcast_recipients SET status = 'skipped', updated_at = ? WHERE broadcast_id = ? AND status = 'pending'`)
    .bind(ts, id)
    .run();
  return c.json({ ok: true });
});

/* =========================== Uploads (R2) =========================== */

const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

adminRoutes.post('/uploads', requireRole('editor'), async (c) => {
  if (!c.env.MEDIA) return c.json({ error: 'Image uploads are not set up (R2 bucket missing). Paste an image link instead.' }, 503);
  const form = await c.req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return c.json({ error: 'Please choose an image.' }, 400);
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return c.json({ error: 'Only JPG, PNG, WebP or GIF images are allowed.' }, 400);
  if (file.size > 5 * 1024 * 1024) return c.json({ error: 'Images must be 5 MB or smaller.' }, 400);
  const d = new Date();
  const key = `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${ext}`;
  await c.env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return c.json({ url: `/media/${key}` }, 201);
});

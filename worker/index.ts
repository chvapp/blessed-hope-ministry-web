import { Hono } from 'hono';
import type { AppBindings, Env } from './env.ts';
import { processBroadcastQueue } from './lib/whatsapp.ts';
import { adminRoutes } from './routes/admin.ts';
import { paymentRoutes } from './routes/payments.ts';
import { publicRoutes, serveMedia } from './routes/public.ts';
import { whatsappWebhook } from './routes/whatsappWebhook.ts';

const app = new Hono<AppBindings>();

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (c.req.path.startsWith('/api/admin')) c.header('Cache-Control', 'no-store');
});

app.route('/api', publicRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/whatsapp/webhook', whatsappWebhook);
app.route('/api/admin', adminRoutes);
app.get('/media/*', (c) => serveMedia(c));

app.all('/api/*', (c) => c.json({ error: 'Not found.' }, 404));
// Everything else is the React app (static assets with SPA fallback).
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Something went wrong. Please try again.' }, 500);
});

export default {
  fetch: app.fetch,
  /** Cron trigger: keeps WhatsApp broadcasts moving in small batches. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(processBroadcastQueue(env));
  },
} satisfies ExportedHandler<Env>;

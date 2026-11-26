# Blessed Hope Gospel Ministry

Church website and staff dashboard for Blessed Hope Gospel Ministry, global headquarters: 9 Effanga Offiong Street, off Edibe Edibe Road, Calabar South, Calabar, Cross River State. It runs entirely on **Cloudflare**: a single Worker serves the React site and the API, with **D1** for data, **R2** for uploaded images, and a cron trigger that sends WhatsApp broadcasts.

## Features

**Public site:** home, about and beliefs, ministries, a daily devotional released at midnight in each visitor's own timezone, sermons and livestream, events with countdown and add-to-calendar, testimonies, prayer requests, plan a visit, new birth, church locator, contact, Bible Academy, resources, Paystack giving, and WhatsApp opt-in.

**Admin (`/admin`):** devotionals, sermons, events, inbox (prayer, testimonies, first-timers, new believers, contact), members (import from CSV, groups), WhatsApp broadcasts, giving ledger (CSV export, re-verify with Paystack), site settings, and team accounts with roles (super admin, admin, editor).

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite, MUI, React Router (`app/`) |
| API | Hono on Cloudflare Workers (`worker/`) |
| Database | Cloudflare D1 (SQLite): schema in `migrations/`, sample data in `seed.sql` |
| Files | Cloudflare R2 (optional, for admin image uploads) |
| Payments | Paystack (redirect checkout + signed webhook) |
| Messaging | WhatsApp Business Cloud API (Meta) |

## Local development

Prerequisite: [Bun](https://bun.sh).

```sh
bun install
cp .dev.vars.example .dev.vars      # then fill in SESSION_SECRET and ADMIN_SETUP_TOKEN at least
bun run db:migrate:local
bun run db:seed:local               # optional sample content
bun run dev                         # http://localhost:5173
```

`bun run dev` runs the site and the Worker together (inside Cloudflare's `workerd` runtime) with a local D1 database in `.wrangler/`.

Open `/admin` and create the first super admin with the `ADMIN_SETUP_TOKEN` from `.dev.vars`. Setup locks itself once an account exists.

## Deploying to Cloudflare

```sh
bunx wrangler login
bunx wrangler d1 create blessed-hope-db          # copy the database_id into wrangler.jsonc
bunx wrangler r2 bucket create blessed-hope-media # optional: admin image uploads
bun run db:migrate:remote
bun run db:seed:remote                           # optional sample content

# Secrets (each prompts for the value)
bunx wrangler secret put SESSION_SECRET          # openssl rand -hex 32
bunx wrangler secret put ADMIN_SETUP_TOKEN       # any long random string; needed once for /admin setup
bunx wrangler secret put PAYSTACK_SECRET_KEY

bun run deploy
```

Then set `APP_URL` (your public URL) and `PAYSTACK_PUBLIC_KEY` under `vars` in `wrangler.jsonc` and redeploy. Point your domain at the Worker in the Cloudflare dashboard (Workers → Settings → Domains & Routes).

### Search engines (SEO)

The Worker serves every page with its own title, description, canonical URL, social preview (Open Graph/Twitter) and schema.org structured data (Church, Event, BlogPosting for devotionals, BreadcrumbList), plus `robots.txt` and a live `sitemap.xml`. Unknown URLs return a real 404.

After the first deploy:

1. Set `APP_URL` in `wrangler.jsonc` to the final public URL (e.g. `https://blessedhopegospel.org`) and redeploy. Canonical links and the sitemap use it.
2. Add the site to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters), then submit `https://YOUR-DOMAIN/sitemap.xml`.
3. Create or claim the church's [Google Business Profile](https://business.google.com) with exactly the same name, address and phone as `shared/church.ts`. This matters most for "church in Calabar" searches.
4. Check a page with Google's [Rich Results Test](https://search.google.com/test/rich-results).

Devotionals get permanent links (`/devotionals/2026-11-24`). A devotional only appears in the sitemap and in search metadata once its date has begun everywhere in the world, so no one sees tomorrow's reading early.

### Paystack

1. In the Paystack dashboard, open Settings → API Keys & Webhooks and set the webhook URL to `https://YOUR-DOMAIN/api/payments/webhook`.
2. Gifts are verified on the server before a receipt is shown. A payment only counts when the amount and currency Paystack reports match what was requested.
3. NGN works by default. USD must be enabled on your Paystack account.

### WhatsApp broadcasts

Bulk WhatsApp messages must use **templates approved by Meta**. Free-form messages are only allowed within 24 hours of a member messaging you.

1. Create a Meta app with the WhatsApp product and register the church's number.
2. Create message templates, for example a `daily_devotional` template with variables `{{1}}` (name) and `{{2}}` (message). Wait for approval.
3. Add the secrets: `WHATSAPP_TOKEN` (a permanent system-user token), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`.
4. In the Meta app, set the webhook to `https://YOUR-DOMAIN/api/whatsapp/webhook` with your verify token, and subscribe to `messages`. This records delivered/read receipts and processes STOP/START replies.

Broadcasts are sent in batches every minute by the cron trigger. `BROADCAST_BATCH_SIZE` (default 40) suits the Workers Free plan. On the Paid plan you can raise it to several hundred.

## Scripts

| Script | What it does |
| --- | --- |
| `bun run dev` | Local site + API |
| `bun run build` | Production build |
| `bun run deploy` | Build and deploy to Cloudflare |
| `bun run lint` | Type-check app and worker |
| `bun run db:migrate:local` / `:remote` | Apply D1 migrations |
| `bun run db:seed:local` / `:remote` | Load sample content |

## Customising content

- **Church name, address, presiding pastor, service times, social links:** `shared/church.ts` (used by the site and by search-engine data)
- **Page titles and descriptions for search results:** `shared/seo.ts`
- **Ministries, branches, beliefs, pastor bio:** `app/content/site.ts`
- **Theme of the month, livestream links, contact details, bank details, WhatsApp chat number:** Admin → Site settings
- **Logo (placeholder):** `app/components/site/Logo.tsx` and `public/favicon.svg`. The social preview image (`public/og-image.jpg`) and app icons (`public/icons/`) are rendered from it; regenerate them when the real logo arrives.
- **Colours and fonts:** `app/theme/muiTheme.ts`

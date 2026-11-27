/**
 * Server-side SEO for the single-page app.
 *
 * Every page request comes through here first. We fetch the built index.html and
 * rewrite its <head> so each URL ships its own title, description, canonical link,
 * Open Graph/Twitter preview and schema.org structured data, plus a <noscript>
 * summary. Search engines and link previews (WhatsApp, Facebook, X) therefore see
 * real page content without running JavaScript. Unknown URLs get a real 404.
 */
import type { Context } from 'hono';
import { CHURCH, CHURCH_MAP_URL, SERVICE_TIMES, SOCIAL_LINKS } from '../../shared/church.ts';
import {
  DEFAULT_OG_IMAGE,
  DEVOTIONAL_PATH_RE,
  NOT_FOUND_META,
  OG_IMAGE_SIZE,
  PAGES,
  SITE_NAME,
  type PageMeta,
  devotionalMeta,
  fullTitle,
} from '../../shared/seo.ts';
import type { AppBindings } from '../env.ts';
import { type DevotionalRow, type EventRow, type SiteSettings, getSettings, mapDevotional, mapEvent } from '../lib/data.ts';
import { resolveLocalDate } from '../lib/timezone.ts';

type Ctx = Context<AppBindings>;
type Devotional = ReturnType<typeof mapDevotional>;
type MinistryEvent = ReturnType<typeof mapEvent>;

/** Calabar observes West Africa Time (UTC+1) all year. */
const WAT_OFFSET = '+01:00';

export function siteOrigin(c: Ctx): string {
  const configured = (c.env.APP_URL || '').trim().replace(/\/+$/, '');
  return configured || new URL(c.req.url).origin;
}

const abs = (origin: string, pathOrUrl: string) => (/^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** JSON for a <script> block: escape "<" so content can never close the tag. */
const jsonForScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * The latest date that has already begun in every timezone on Earth (UTC-12).
 * Devotionals up to this date are public everywhere, so they can be indexed and
 * listed in the sitemap without revealing tomorrow's reading early.
 */
const worldwideUnlockedDate = (now = new Date()) => resolveLocalDate('Etc/GMT+12', now);

// ---------------------------------------------------------------------------
// robots.txt and sitemap.xml
// ---------------------------------------------------------------------------

export function robotsTxt(c: Ctx) {
  const origin = siteOrigin(c);
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=86400' });
}

export async function sitemapXml(c: Ctx) {
  const origin = siteOrigin(c);
  const today = new Date().toISOString().slice(0, 10);
  const { results } = await c.env.DB.prepare(
    `SELECT publish_date, updated_at FROM devotionals WHERE status = 'published' AND publish_date <= ? ORDER BY publish_date DESC LIMIT 5000`
  )
    .bind(worldwideUnlockedDate())
    .all<{ publish_date: string; updated_at: string }>();

  const urls: string[] = [];
  const add = (loc: string, lastmod?: string, changefreq?: string, priority?: number) =>
    urls.push(
      `  <url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}${priority !== undefined ? `<priority>${priority.toFixed(1)}</priority>` : ''}</url>`
    );

  for (const [path, meta] of Object.entries(PAGES)) {
    const fresh = meta.changefreq === 'daily' || path === '/events';
    add(`${origin}${path === '/' ? '/' : path}`, fresh ? today : undefined, meta.changefreq, meta.priority);
  }
  for (const d of results) {
    add(`${origin}/devotionals/${d.publish_date}`, (d.updated_at || d.publish_date).slice(0, 10), 'yearly', 0.5);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
}

// ---------------------------------------------------------------------------
// Structured data (schema.org JSON-LD)
// ---------------------------------------------------------------------------

function churchNode(origin: string, settings: SiteSettings) {
  const sameAs = Object.values(SOCIAL_LINKS).filter((u) => /^https?:\/\/[^/]+\/.+/.test(u));
  return {
    '@type': ['Church', 'Organization'],
    '@id': `${origin}/#church`,
    name: CHURCH.name,
    alternateName: CHURCH.shortName,
    slogan: CHURCH.tagline,
    url: `${origin}/`,
    logo: { '@type': 'ImageObject', url: `${origin}/icons/icon-512.png`, width: 512, height: 512 },
    image: `${origin}${DEFAULT_OG_IMAGE}`,
    description: PAGES['/'].description,
    foundingDate: CHURCH.founded,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${CHURCH.address.street}, ${CHURCH.address.area}`,
      addressLocality: CHURCH.address.city,
      addressRegion: CHURCH.address.state,
      addressCountry: CHURCH.address.countryCode,
    },
    hasMap: CHURCH_MAP_URL,
    ...(settings.contactPhone ? { telephone: settings.contactPhone.replace(/\s+/g, ' ').trim() } : {}),
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    openingHoursSpecification: SERVICE_TIMES.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${s.day}`,
      opens: s.opens,
      closes: s.closes,
    })),
  };
}

const ONLINE_RE = /\b(online|virtual|livestream|live ?stream|zoom|youtube|webinar)\b/i;

function eventNode(origin: string, e: MinistryEvent) {
  // "Main Sanctuary & Online" is both; "Online" alone is virtual only.
  const online = ONLINE_RE.test(e.location);
  const inPerson = !online || e.location.replace(ONLINE_RE, '').replace(/[^a-z]+/gi, ' ').replace(/\b(global|and|campus)\b/gi, '').trim().length > 0;
  const place = {
    '@type': 'Place',
    name: inPerson ? e.location.split(/\s*(?:&|\band\b|,)\s*/)[0] || CHURCH.name : CHURCH.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${CHURCH.address.street}, ${CHURCH.address.area}`,
      addressLocality: CHURCH.address.city,
      addressRegion: CHURCH.address.state,
      addressCountry: CHURCH.address.countryCode,
    },
  };
  const virtual = { '@type': 'VirtualLocation', url: `${origin}/media` };
  const mode = online && inPerson ? 'Mixed' : online ? 'Online' : 'Offline';
  return {
    '@type': 'Event',
    name: e.title,
    description: e.description || `${e.title} at ${CHURCH.name}, Calabar.`,
    startDate: e.startAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: `https://schema.org/${mode}EventAttendanceMode`,
    location: mode === 'Mixed' ? [place, virtual] : mode === 'Online' ? virtual : place,
    image: [abs(origin, e.imageUrl || DEFAULT_OG_IMAGE)],
    organizer: { '@type': 'Organization', '@id': `${origin}/#church`, name: CHURCH.name, url: `${origin}/` },
    url: `${origin}/events`,
    isAccessibleForFree: true,
  };
}

function devotionalNode(origin: string, url: string, d: Devotional, description: string) {
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: d.title,
    description,
    datePublished: `${d.publishDate}T00:00:00${WAT_OFFSET}`,
    // Pre-written devotionals are edited before their date; only report later edits.
    ...(d.updatedAt && d.updatedAt.slice(0, 10) > d.publishDate ? { dateModified: d.updatedAt } : {}),
    author: { '@type': 'Person', name: d.author || CHURCH.name },
    publisher: { '@id': `${origin}/#church` },
    image: `${origin}${DEFAULT_OG_IMAGE}`,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    articleSection: 'Daily Devotional',
    inLanguage: 'en',
    ...(d.scriptureRef ? { citation: d.scriptureRef } : {}),
  };
}

const PAGE_TYPES: Record<string, string> = {
  '/about': 'AboutPage',
  '/contact': 'ContactPage',
  '/events': 'CollectionPage',
  '/media': 'CollectionPage',
  '/testimonies': 'CollectionPage',
};

// ---------------------------------------------------------------------------
// Page rendering
// ---------------------------------------------------------------------------

interface ResolvedPage {
  status: 200 | 404;
  meta: PageMeta;
  canonicalPath: string;
  ogType: 'website' | 'article';
  robots: string;
  extraNodes: unknown[];
  crumbs: Array<{ name: string; path: string }>;
  noscriptBody: string;
  preloadImage?: string;
}

const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX = 'noindex, nofollow';

async function resolvePage(c: Ctx, path: string, origin: string): Promise<ResolvedPage> {
  const base = { ogType: 'website' as const, robots: INDEX_ROBOTS, extraNodes: [] as unknown[], noscriptBody: '' };

  if (path === '/admin' || path.startsWith('/admin/')) {
    return {
      ...base,
      status: 200,
      meta: { title: 'Staff dashboard', description: `Staff sign-in for ${SITE_NAME}.`, crumb: 'Admin' },
      canonicalPath: '/admin',
      robots: NOINDEX,
      crumbs: [],
    };
  }

  const page = PAGES[path];
  if (page) {
    const resolved: ResolvedPage = {
      ...base,
      status: 200,
      meta: page,
      canonicalPath: path,
      crumbs: path === '/' ? [] : [{ name: page.crumb, path }],
      preloadImage: path === '/' ? '/images/hero/hero-1-1280.jpg' : undefined,
    };
    if (path === '/about') {
      resolved.extraNodes = [
        {
          '@type': 'Person',
          '@id': `${origin}/about#presiding-pastor`,
          name: CHURCH.leader.name,
          jobTitle: CHURCH.leader.title,
          worksFor: { '@id': `${origin}/#church` },
        },
      ];
    }
    if (path === '/events') {
      const { results } = await c.env.DB.prepare('SELECT * FROM events WHERE start_at >= ? ORDER BY start_at ASC LIMIT 20')
        .bind(new Date(Date.now() - 6 * 3_600_000).toISOString())
        .all<EventRow>();
      const events = results.map(mapEvent);
      resolved.extraNodes = events.map((e) => eventNode(origin, e));
      resolved.noscriptBody = events.length
        ? `<h2>Upcoming events</h2><ul>${events
            .map((e) => `<li><strong>${escapeHtml(e.title)}</strong>: ${escapeHtml(e.scheduleLabel || e.startAt)}, ${escapeHtml(e.location)}</li>`)
            .join('')}</ul>`
        : '';
    }
    return resolved;
  }

  const m = DEVOTIONAL_PATH_RE.exec(path);
  if (m) {
    const date = m[1];
    const row = await c.env.DB.prepare(`SELECT * FROM devotionals WHERE publish_date = ? AND status = 'published'`).bind(date).first<DevotionalRow>();
    if (row) {
      const listing = PAGES['/devotionals'];
      const crumbs = [
        { name: listing.crumb, path: '/devotionals' },
        { name: row.title, path },
      ];
      // Only reveal the content once this date has started everywhere in the world.
      if (date > worldwideUnlockedDate()) {
        return { ...base, status: 200, meta: listing, canonicalPath: path, crumbs };
      }
      const d = mapDevotional(row);
      const meta = devotionalMeta(d);
      const url = `${origin}${path}`;
      return {
        ...base,
        status: 200,
        meta: { ...meta, crumb: d.title },
        canonicalPath: path,
        ogType: 'article',
        crumbs,
        extraNodes: [devotionalNode(origin, url, d, meta.description)],
        noscriptBody:
          `<p><strong>${escapeHtml(d.scriptureRef)}</strong>: “${escapeHtml(d.memoryVerse)}”</p>` +
          d.body
            .split('\n\n')
            .map((p) => `<p>${escapeHtml(p)}</p>`)
            .join('') +
          (d.prayerPoints.length ? `<h2>Prayer points</h2><ol>${d.prayerPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ol>` : ''),
      };
    }
  }

  return { ...base, status: 404, meta: NOT_FOUND_META, canonicalPath: path, robots: NOINDEX, crumbs: [] };
}

function buildJsonLd(origin: string, page: ResolvedPage, settings: SiteSettings) {
  const url = `${origin}${page.canonicalPath === '/' ? '/' : page.canonicalPath}`;
  const title = fullTitle(page.meta.title);
  const graph: unknown[] = [
    churchNode(origin, settings),
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: `${origin}/`,
      name: SITE_NAME,
      alternateName: CHURCH.shortName,
      publisher: { '@id': `${origin}/#church` },
      inLanguage: 'en',
    },
    {
      '@type': PAGE_TYPES[page.canonicalPath] || 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description: page.meta.description,
      isPartOf: { '@id': `${origin}/#website` },
      about: { '@id': `${origin}/#church` },
      primaryImageOfPage: { '@type': 'ImageObject', url: abs(origin, page.meta.image || DEFAULT_OG_IMAGE) },
      inLanguage: 'en',
      ...(page.crumbs.length ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
  ];
  if (page.crumbs.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [{ name: 'Home', path: '/' }, ...page.crumbs].map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: `${origin}${crumb.path}`,
      })),
    });
  }
  graph.push(...page.extraNodes);
  return { '@context': 'https://schema.org', '@graph': graph };
}

function noscriptHtml(page: ResolvedPage, settings: SiteSettings): string {
  const links = Object.entries(PAGES)
    .map(([p, meta]) => `<a href="${p}">${escapeHtml(meta.crumb)}</a>`)
    .join(' · ');
  const services = SERVICE_TIMES.map((s) => `${s.day}: ${s.name}, ${s.times.join(', ')}`).join('<br>');
  return (
    `<noscript><div style="max-width:760px;margin:0 auto;padding:120px 16px 48px;font-family:system-ui,sans-serif;line-height:1.6;color:#0D0D0D">` +
    `<h1>${escapeHtml(page.crumbs.at(-1)?.name || page.meta.title)}</h1>` +
    `<p>${escapeHtml(page.meta.description)}</p>` +
    page.noscriptBody +
    `<h2>Visit us</h2><p>${escapeHtml(CHURCH.name)}<br>${escapeHtml(settings.sanctuaryAddress)}</p><p>${services}<br>(West Africa Time)</p>` +
    `<nav aria-label="Site">${links}</nav>` +
    `<p><small>Turn on JavaScript for the full site.</small></p>` +
    `</div></noscript>`
  );
}

/** Serves an app page with route-specific metadata injected into the HTML shell. */
export async function renderPage(c: Ctx): Promise<Response> {
  const url = new URL(c.req.url);
  const path = url.pathname;

  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return c.env.ASSETS.fetch(c.req.raw);
  // Vite's dev-server internals (/@vite/client, /@react-refresh, /node_modules/...).
  if (/^\/(@|node_modules\/|__)/.test(path)) return c.env.ASSETS.fetch(c.req.raw);

  // Files (anything with an extension) come straight from static assets, but a
  // missing file must be a real 404, not the app shell.
  if (/\.[a-z0-9]+$/i.test(path)) {
    const res = await c.env.ASSETS.fetch(c.req.raw);
    const type = res.headers.get('Content-Type') || '';
    if (res.ok && type.includes('text/html') && !path.endsWith('.html')) {
      return c.text('Not found', 404, { 'X-Robots-Tag': 'noindex' });
    }
    return res;
  }

  // One URL per page: drop trailing slashes.
  if (path.length > 1 && path.endsWith('/')) {
    return c.redirect(`${path.replace(/\/+$/, '') || '/'}${url.search}`, 301);
  }

  const origin = siteOrigin(c);
  const [shell, settings, page] = await Promise.all([
    c.env.ASSETS.fetch(new Request(new URL('/', url.origin))),
    getSettings(c.env),
    resolvePage(c, path, origin),
  ]);
  if (!shell.ok) return shell;

  const canonical = `${origin}${page.canonicalPath === '/' ? '/' : page.canonicalPath}`;
  const title = fullTitle(page.meta.title);
  const description = page.meta.description;
  const image = abs(origin, page.meta.image || DEFAULT_OG_IMAGE);

  const setContent = (value: string) => ({ element: (el: Element) => void el.setAttribute('content', value) });
  const headExtras =
    `<link rel="canonical" href="${escapeHtml(canonical)}">` +
    `<script type="application/ld+json" data-seo-ld>${jsonForScript(buildJsonLd(origin, page, settings))}</script>` +
    (page.preloadImage
      ? `<link rel="preload" as="image" href="${page.preloadImage}" imagesrcset="${page.preloadImage} 1280w, ${page.preloadImage.replace('-1280.', '-2400.')} 2400w" imagesizes="100vw" fetchpriority="high">`
      : '');

  const rewritten = new HTMLRewriter()
    .on('title', { element: (el) => void el.setInnerContent(title) })
    .on('meta[name="description"]', setContent(description))
    .on('meta[name="robots"]', setContent(page.robots))
    .on('meta[property="og:type"]', setContent(page.ogType))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[property="og:url"]', setContent(canonical))
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[property="og:image:width"]', setContent(String(OG_IMAGE_SIZE.width)))
    .on('meta[property="og:image:height"]', setContent(String(OG_IMAGE_SIZE.height)))
    .on('meta[name="twitter:title"]', setContent(title))
    .on('meta[name="twitter:description"]', setContent(description))
    .on('meta[name="twitter:image"]', setContent(image))
    .on('head', { element: (el) => void el.append(headExtras, { html: true }) })
    .on('body', { element: (el) => void el.prepend(noscriptHtml(page, settings), { html: true }) })
    .transform(shell);

  const headers = new Headers(rewritten.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  // HTML always revalidates so a new deploy never serves stale asset links.
  headers.set('Cache-Control', 'no-cache');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.delete('ETag');
  headers.delete('Content-Length');
  if (page.robots === NOINDEX) headers.set('X-Robots-Tag', NOINDEX);

  return new Response(c.req.method === 'HEAD' ? null : rewritten.body, { status: page.status, headers });
}

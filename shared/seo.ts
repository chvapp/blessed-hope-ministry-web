/**
 * Search and social metadata for every public page. The Worker writes these into the
 * HTML it serves (so crawlers and link previews see them without running JavaScript),
 * and the React app keeps them in sync as visitors navigate.
 */
import { CHURCH } from './church.ts';

export interface PageMeta {
  /** Page title without the site name suffix. */
  title: string;
  /** 120–160 characters works best in search results. */
  description: string;
  /** Short name for breadcrumbs. */
  crumb: string;
  /** Social preview image (path or absolute URL). Defaults to DEFAULT_OG_IMAGE. */
  image?: string;
  /** Sitemap hints. */
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
}

export const SITE_NAME = CHURCH.name;
export const DEFAULT_OG_IMAGE = '/og-image.jpg';
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const HOME_TITLE = `${CHURCH.name} | Church in Calabar, Cross River State`;

export const PAGES: Record<string, PageMeta> = {
  '/': {
    title: HOME_TITLE,
    description:
      'Blessed Hope Gospel Ministry is a Bible-teaching church with its global headquarters in Calabar South, Calabar. Join us for worship, prayer and the Word, in person or online.',
    crumb: 'Home',
    changefreq: 'daily',
    priority: 1,
  },
  '/about': {
    title: 'About Us & What We Believe',
    description:
      'Our story, mandate, leadership and statement of faith. Blessed Hope Gospel Ministry is a church family in Calabar, Nigeria, looking for the blessed hope (Titus 2:13).',
    crumb: 'About',
    changefreq: 'monthly',
    priority: 0.8,
  },
  '/devotionals': {
    title: 'Daily Devotional',
    description:
      'Read today’s devotional from Blessed Hope Gospel Ministry: scripture, a memory verse, teaching and prayer points, released at midnight in your own timezone.',
    crumb: 'Daily Devotional',
    changefreq: 'daily',
    priority: 0.9,
  },
  '/media': {
    title: 'Sermons & Livestream',
    description:
      'Watch Blessed Hope Gospel Ministry services live from Calabar and catch up on recent sermons, teaching series and Hope Radio.',
    crumb: 'Sermons',
    changefreq: 'weekly',
    priority: 0.8,
  },
  '/events': {
    title: 'Events & Programmes',
    description:
      'Upcoming services, conventions and programmes at Blessed Hope Gospel Ministry in Calabar. Add events to your calendar and join us in person or online.',
    crumb: 'Events',
    changefreq: 'weekly',
    priority: 0.8,
  },
  '/ministries': {
    title: 'Ministries',
    description:
      'Youth church, campus fellowship, home cells, women, men, children and online church: find your place to grow and serve at Blessed Hope Gospel Ministry, Calabar.',
    crumb: 'Ministries',
    changefreq: 'monthly',
    priority: 0.7,
  },
  '/academy': {
    title: 'Bible Academy',
    description:
      'Foundation classes, school of ministry and leadership training at the Blessed Hope Gospel Ministry Bible Academy in Calabar. Apply for the next cohort.',
    crumb: 'Bible Academy',
    changefreq: 'monthly',
    priority: 0.6,
  },
  '/plan-a-visit': {
    title: 'Plan Your Visit',
    description:
      'Visiting a church in Calabar? Service times, directions to 9 Effanga Offiong Street in Calabar South, and what to expect on your first Sunday with us.',
    crumb: 'Plan a Visit',
    changefreq: 'monthly',
    priority: 0.8,
  },
  '/locations': {
    title: 'Locations',
    description:
      'Find Blessed Hope Gospel Ministry: our global headquarters is at 9 Effanga Offiong Street, off Edibe Edibe Road, Calabar South, Calabar, Cross River State.',
    crumb: 'Locations',
    changefreq: 'monthly',
    priority: 0.7,
  },
  '/contact': {
    title: 'Contact Us',
    description:
      'Contact Blessed Hope Gospel Ministry in Calabar: address, phone, email and service times. Send us a message and we will get back to you.',
    crumb: 'Contact',
    changefreq: 'yearly',
    priority: 0.7,
  },
  '/give': {
    title: 'Give Online',
    description:
      'Give tithes, offerings and seeds to Blessed Hope Gospel Ministry securely online with Paystack, or by bank transfer. Thank you for partnering with us.',
    crumb: 'Give',
    changefreq: 'yearly',
    priority: 0.6,
  },
  '/prayer': {
    title: 'Prayer Request',
    description:
      'Send a prayer request to Blessed Hope Gospel Ministry. Our intercessors in Calabar pray over every request we receive, in confidence.',
    crumb: 'Prayer Request',
    changefreq: 'yearly',
    priority: 0.6,
  },
  '/testimonies': {
    title: 'Testimonies',
    description:
      'Stories of healing, provision, restoration and salvation from the Blessed Hope Gospel Ministry family. Read testimonies and share your own.',
    crumb: 'Testimonies',
    changefreq: 'weekly',
    priority: 0.6,
  },
  '/new-birth': {
    title: 'Give Your Life to Jesus',
    description:
      'The greatest decision you will ever make. Learn how to receive Jesus Christ as your Lord and Saviour, and let Blessed Hope Gospel Ministry walk with you.',
    crumb: 'New Birth',
    changefreq: 'yearly',
    priority: 0.6,
  },
  '/resources': {
    title: 'Prayer Guides & Resources',
    description:
      'Monthly prayer focus, study guides and pastoral care resources from Blessed Hope Gospel Ministry to strengthen your walk with God.',
    crumb: 'Resources',
    changefreq: 'monthly',
    priority: 0.5,
  },
};

export const NOT_FOUND_META: PageMeta = {
  title: 'Page Not Found',
  description: 'Sorry, we couldn’t find that page. Visit the Blessed Hope Gospel Ministry home page, today’s devotional or our service times.',
  crumb: 'Not found',
};

/** Builds the full <title>, keeping the home page title as written. */
export function fullTitle(title: string): string {
  return title === HOME_TITLE || title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

/** Devotional permalinks: /devotionals/YYYY-MM-DD. */
export const DEVOTIONAL_PATH_RE = /^\/devotionals\/(\d{4}-\d{2}-\d{2})$/;

/** Plain-text excerpt for meta descriptions. */
export function excerpt(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,.;:]$/, '')}…`;
}

/** Title and description for a devotional permalink page (shared by Worker and app). */
export function devotionalMeta(d: { title: string; scriptureRef: string; memoryVerse: string; body: string }): { title: string; description: string } {
  return {
    title: `${d.title}: Daily Devotional`,
    description: excerpt(`${d.scriptureRef ? `${d.scriptureRef}. ` : ''}${d.body || d.memoryVerse}`),
  };
}

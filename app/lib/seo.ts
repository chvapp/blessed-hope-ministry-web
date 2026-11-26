/**
 * Keeps <head> metadata in step with client-side navigation. The Worker already
 * writes the right tags into the first HTML response (see worker/routes/seo.ts);
 * this updates them when visitors move between pages without a reload, so shares,
 * bookmarks and Google's renderer always see the current page's details.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_OG_IMAGE,
  DEVOTIONAL_PATH_RE,
  NOT_FOUND_META,
  PAGES,
  SITE_NAME,
  fullTitle,
} from '../../shared/seo.ts';

export interface HeadMeta {
  title: string;
  description: string;
  /** Path for the canonical URL; defaults to the current path. */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

export function applyHeadMeta(meta: HeadMeta) {
  const origin = window.location.origin;
  const title = fullTitle(meta.title);
  const url = `${origin}${meta.path ?? window.location.pathname}`;
  const image = /^https?:/i.test(meta.image || '') ? (meta.image as string) : `${origin}${meta.image || DEFAULT_OG_IMAGE}`;

  document.title = title;
  setMeta('name', 'description', meta.description);
  setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : INDEX_ROBOTS);
  setCanonical(url);
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:type', meta.type || 'website');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', meta.description);
  setMeta('name', 'twitter:image', image);
}

/** Route-level metadata for every page; mount once inside the router. */
export function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Structured data in the first HTML response describes that URL only.
    if (pathname !== initialPath) document.head.querySelectorAll('script[data-seo-ld]').forEach((n) => n.remove());

    const page = PAGES[pathname];
    if (page) return applyHeadMeta({ title: page.title, description: page.description, image: page.image });
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return applyHeadMeta({ title: 'Staff dashboard', description: `Staff sign-in for ${SITE_NAME}.`, path: '/admin', noindex: true });
    }
    if (DEVOTIONAL_PATH_RE.test(pathname)) {
      // The devotional page refines this once the reading loads.
      const listing = PAGES['/devotionals'];
      return applyHeadMeta({ title: listing.title, description: listing.description });
    }
    applyHeadMeta({ title: NOT_FOUND_META.title, description: NOT_FOUND_META.description, noindex: true });
  }, [pathname]);

  return null;
}

const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';

/** Page-specific override (e.g. a devotional's own title). Pass null to skip. */
export function useHeadMeta(meta: HeadMeta | null) {
  const key = meta ? JSON.stringify(meta) : '';
  useEffect(() => {
    if (meta) applyHeadMeta(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

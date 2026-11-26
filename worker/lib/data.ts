import type { Env } from '../env.ts';
import { nowIso } from './util.ts';

/* ---------- Row → API shapes (camelCase, matching app/types.ts) ---------- */

export interface DevotionalRow {
  id: string;
  publish_date: string;
  title: string;
  scripture_ref: string;
  memory_verse: string;
  focus: string;
  body: string;
  prayer_points: string;
  author: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}
export const mapDevotional = (r: DevotionalRow) => ({
  id: r.id,
  publishDate: r.publish_date,
  title: r.title,
  scriptureRef: r.scripture_ref,
  memoryVerse: r.memory_verse,
  propheticFocus: r.focus,
  body: r.body,
  prayerPoints: safeJsonArray(r.prayer_points),
  author: r.author,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export interface SermonRow {
  id: string;
  title: string;
  speaker: string;
  series: string;
  category: string;
  media_type: 'video' | 'audio';
  media_url: string;
  thumbnail_url: string;
  duration: string;
  preached_date: string;
  summary: string;
  is_featured: number;
  created_at: string;
}
export const mapSermon = (r: SermonRow) => ({
  id: r.id,
  title: r.title,
  speaker: r.speaker,
  series: r.series,
  category: r.category,
  mediaType: r.media_type,
  mediaUrl: r.media_url,
  thumbnailUrl: r.thumbnail_url,
  duration: r.duration,
  preachedDate: r.preached_date,
  summary: r.summary,
  isFeatured: Boolean(r.is_featured),
  createdAt: r.created_at,
});

export interface EventRow {
  id: string;
  title: string;
  category: 'service' | 'convention' | 'academy';
  schedule_label: string;
  start_at: string;
  location: string;
  description: string;
  image_url: string;
  is_countdown_target: number;
  created_at: string;
}
export const mapEvent = (r: EventRow) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  scheduleLabel: r.schedule_label,
  startAt: r.start_at,
  location: r.location,
  description: r.description,
  imageUrl: r.image_url,
  isCountdownTarget: Boolean(r.is_countdown_target),
  createdAt: r.created_at,
});

export interface DonationRow {
  id: string;
  reference: string;
  donor_name: string;
  donor_email: string;
  category: string;
  currency: string;
  amount_minor: number;
  status: 'pending' | 'success' | 'failed';
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
}
export const mapDonation = (r: DonationRow) => ({
  id: r.id,
  reference: r.reference,
  donorName: r.donor_name,
  donorEmail: r.donor_email,
  category: r.category,
  currency: r.currency,
  amountMinor: r.amount_minor,
  status: r.status,
  gatewayResponse: r.gateway_response,
  paidAt: r.paid_at,
  createdAt: r.created_at,
});

export interface SubmissionRow {
  id: string;
  type: string;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_approved: number;
  status: 'new' | 'reviewed';
  created_at: string;
}
export const mapSubmission = (r: SubmissionRow) => ({
  id: r.id,
  type: r.type,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  subject: r.subject,
  message: r.message,
  isApproved: Boolean(r.is_approved),
  status: r.status,
  createdAt: r.created_at,
});

export interface SubscriberRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  tags: string;
  whatsapp_opt_in: number;
  source: string;
  created_at: string;
  opted_out_at: string | null;
}
export const mapSubscriber = (r: SubscriberRow) => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  tags: r.tags ? r.tags.split(',') : [],
  whatsappOptIn: Boolean(r.whatsapp_opt_in) && !r.opted_out_at,
  source: r.source,
  createdAt: r.created_at,
  optedOutAt: r.opted_out_at,
});

export interface BroadcastRow {
  id: string;
  channel: string;
  template_name: string;
  template_lang: string;
  body_params: string;
  audience_tag: string;
  preview_text: string;
  status: 'queued' | 'sending' | 'completed' | 'cancelled';
  total: number;
  sent: number;
  failed: number;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}
export const mapBroadcast = (r: BroadcastRow) => ({
  id: r.id,
  channel: r.channel,
  templateName: r.template_name,
  templateLang: r.template_lang,
  bodyParams: safeJsonArray(r.body_params),
  audienceTag: r.audience_tag,
  previewText: r.preview_text,
  status: r.status,
  total: r.total,
  sent: r.sent,
  failed: r.failed,
  createdBy: r.created_by,
  createdAt: r.created_at,
  completedAt: r.completed_at,
});

function safeJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/* ---------- Settings (key/value JSON) ---------- */

export interface SiteSettings {
  ministryName: string;
  monthlyTheme: string;
  monthlyScripture: string;
  monthlyDeclaration: string;
  liveActive: boolean;
  liveTitle: string;
  liveStreamEnglishUrl: string;
  liveStreamFrenchUrl: string;
  liveStreamYorubaUrl: string;
  radioStreamUrl: string;
  sanctuaryAddress: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  ministryName: 'Blessed Hope Gospel Ministry',
  monthlyTheme: 'Walking in Covenant Rest & Fruitfulness',
  monthlyScripture: 'Isaiah 32:17–18',
  monthlyDeclaration:
    'And the work of righteousness shall be peace; and the effect of righteousness quietness and assurance for ever.',
  liveActive: false,
  liveTitle: 'Sunday Celebration Service',
  liveStreamEnglishUrl: '',
  liveStreamFrenchUrl: '',
  liveStreamYorubaUrl: '',
  radioStreamUrl: '',
  sanctuaryAddress: '9 Effanga Offiong Street, off Edibe Edibe Road, Calabar South, Calabar, Cross River State, Nigeria',
  contactEmail: 'care@blessedhopeministry.org',
  contactPhone: '+234 800 555 0194',
  whatsappNumber: '',
  bankName: '',
  bankAccountName: 'Blessed Hope Gospel Ministry',
  bankAccountNumber: '',
  updatedAt: '',
};

export async function getSettings(env: Env): Promise<SiteSettings> {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of results) {
    if (row.key in DEFAULT_SETTINGS) {
      try {
        out[row.key] = JSON.parse(row.value);
      } catch {
        /* ignore corrupt value */
      }
    }
  }
  return out as unknown as SiteSettings;
}

export async function saveSettings(env: Env, patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const entries = Object.entries({ ...patch, updatedAt: nowIso() }).filter(([k]) => k in DEFAULT_SETTINGS);
  if (entries.length) {
    await env.DB.batch(
      entries.map(([k, v]) =>
        env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(
          k,
          JSON.stringify(v)
        )
      )
    );
  }
  return getSettings(env);
}

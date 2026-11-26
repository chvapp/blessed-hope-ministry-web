export type DevotionalStatus = 'draft' | 'published';

export interface Devotional {
  id: string;
  publishDate: string;
  title: string;
  scriptureRef: string;
  memoryVerse: string;
  propheticFocus: string;
  body: string;
  prayerPoints: string[];
  author: string;
  status: DevotionalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimezoneSnapshot {
  timeZone: string;
  label: string;
  localDate: string;
  localTime: string;
  offsetLabel: string;
}

export interface DevotionalTodayResponse {
  visitorTimeZone: string;
  visitorLocalDate: string;
  visitorLocalTime: string;
  visitorOffset: string;
  exactDateMatch: boolean;
  todayDevotional: Devotional | null;
  archive: Devotional[];
  nextLockedCount: number;
  globalComparison: TimezoneSnapshot[];
}

export type SermonMediaType = 'video' | 'audio';

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  series: string;
  category: string;
  mediaType: SermonMediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  duration: string;
  preachedDate: string;
  summary: string;
  isFeatured: boolean;
  createdAt: string;
}

export type EventCategory = 'service' | 'convention' | 'academy';

export interface MinistryEvent {
  id: string;
  title: string;
  category: EventCategory;
  scheduleLabel: string;
  startAt: string;
  location: string;
  description: string;
  imageUrl?: string;
  isCountdownTarget: boolean;
  createdAt: string;
}

export type GivingCategory = 'tithe' | 'offering' | 'partnership' | 'project';
export type GivingCurrency = 'NGN' | 'USD';
export type DonationStatus = 'pending' | 'success' | 'failed';

export interface Donation {
  id: string;
  reference: string;
  donorName: string;
  donorEmail: string;
  category: GivingCategory;
  currency: GivingCurrency;
  amountMinor: number;
  status: DonationStatus;
  gatewayResponse: string;
  paidAt: string | null;
  createdAt: string;
}

export type CommunitySubmissionType =
  | 'prayer'
  | 'testimony'
  | 'first_timer'
  | 'academy'
  | 'contact'
  | 'salvation';

export interface CommunitySubmission {
  id: string;
  type: CommunitySubmissionType;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isApproved: boolean;
  status: 'new' | 'reviewed';
  createdAt: string;
}

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

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  whatsappOptIn: boolean;
  source: string;
  createdAt: string;
  optedOutAt: string | null;
}

export type BroadcastStatus = 'queued' | 'sending' | 'completed' | 'cancelled';

export interface Broadcast {
  id: string;
  channel: string;
  templateName: string;
  templateLang: string;
  bodyParams: string[];
  audienceTag: string;
  previewText: string;
  status: BroadcastStatus;
  total: number;
  sent: number;
  failed: number;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  status: string;
  bodyText: string;
  bodyParamCount: number;
}

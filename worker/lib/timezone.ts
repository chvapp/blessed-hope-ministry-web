export interface TimezoneSnapshot {
  timeZone: string;
  label: string;
  localDate: string; // YYYY-MM-DD
  localTime: string;
  offsetLabel: string;
}

const FEATURED_ZONES: Array<{ timeZone: string; label: string }> = [
  { timeZone: 'America/Toronto', label: 'Toronto, Canada' },
  { timeZone: 'Europe/London', label: 'London, UK' },
  { timeZone: 'Africa/Lagos', label: 'Lagos, Nigeria' },
  { timeZone: 'Australia/Sydney', label: 'Sydney, Australia' },
];

export function validateTimeZone(input?: string | null): string {
  if (!input || typeof input !== 'string') {
    return 'UTC';
  }
  const candidate = input.trim();
  if (!candidate || candidate.length > 64) {
    return 'UTC';
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return 'UTC';
  }
}

export function resolveLocalDate(timeZone: string, now: Date = new Date()): string {
  const safeZone = validateTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: safeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function resolveLocalTimeLabel(timeZone: string, now: Date = new Date()): string {
  const safeZone = validateTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);
}

export function resolveOffsetLabel(timeZone: string, now: Date = new Date()): string {
  const safeZone = validateTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: safeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(now);
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';
}

export function getGlobalTimezoneComparison(now: Date = new Date()): TimezoneSnapshot[] {
  return FEATURED_ZONES.map((zone) => ({
    timeZone: zone.timeZone,
    label: zone.label,
    localDate: resolveLocalDate(zone.timeZone, now),
    localTime: resolveLocalTimeLabel(zone.timeZone, now),
    offsetLabel: resolveOffsetLabel(zone.timeZone, now),
  }));
}

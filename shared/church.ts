/**
 * The church's identity, shared by the React app and the Worker (which uses it for
 * search-engine metadata and structured data). Keep these details accurate: Google
 * compares them with the church's Google Business Profile.
 */

export const CHURCH = {
  name: 'Blessed Hope Gospel Ministry',
  shortName: 'Blessed Hope',
  tagline: 'Looking for the blessed hope',
  founded: '2010',
  leader: { name: 'Pastor Gabriel Joseph', title: 'Presiding Pastor' },
  /** The global headquarters is the Calabar sanctuary below. */
  address: {
    street: '9 Effanga Offiong Street, off Edibe Edibe Road',
    area: 'Calabar South',
    city: 'Calabar',
    state: 'Cross River State',
    /** ISO 3166-2 subdivision code for Cross River State. */
    regionCode: 'NG-CR',
    country: 'Nigeria',
    countryCode: 'NG',
  },
  timeZone: 'Africa/Lagos', // West Africa Time, which Calabar observes
} as const;

export const CHURCH_ADDRESS_LINE = [
  CHURCH.address.street,
  CHURCH.address.area,
  CHURCH.address.city,
  CHURCH.address.state,
  CHURCH.address.country,
].join(', ');

export const CHURCH_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CHURCH_ADDRESS_LINE)}`;

export interface ServiceTime {
  /** English day name, e.g. "Sunday" (also used for schema.org dayOfWeek). */
  day: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  name: string;
  /** Display times, e.g. "9:30 AM". */
  times: string[];
  /** 24-hour start/end for structured data. */
  opens: string;
  closes: string;
}

/** Placeholder schedule: replace with the church's real service times. */
export const SERVICE_TIMES: ServiceTime[] = [
  { day: 'Sunday', name: 'Celebration Service', times: ['7:30 AM', '9:30 AM', '11:30 AM'], opens: '07:30', closes: '13:30' },
  { day: 'Wednesday', name: 'Midweek Word & Communion', times: ['6:00 PM'], opens: '18:00', closes: '20:00' },
  { day: 'Friday', name: 'Hour of Prayer', times: ['6:00 PM'], opens: '18:00', closes: '20:00' },
];

/** Social profiles. Leave a value empty until the church has that account. */
export const SOCIAL_LINKS = {
  youtube: '',
  facebook: '',
  instagram: '',
  x: '',
};

/**
 * Static site content. Placeholder copy for Blessed Hope Gospel Ministry: replace names,
 * addresses, times and links with the church's real details.
 * (Live settings such as contact email/phone and stream URLs come from the admin
 * dashboard via /api/site and override these where shown.)
 */
import { GENERATED_IMAGES } from '../components/EditorialImage.tsx';
import { CHURCH, CHURCH_ADDRESS_LINE, SERVICE_TIMES, SOCIAL_LINKS } from '../../shared/church.ts';

export { CHURCH, CHURCH_ADDRESS_LINE, SERVICE_TIMES };
export type { ServiceTime } from '../../shared/church.ts';

export const IMAGES = {
  sanctuary: GENERATED_IMAGES.heroSanctuary,
  worship: GENERATED_IMAGES.worshipCongregation,
  study: GENERATED_IMAGES.devotionalStudy,
  fellowship: GENERATED_IMAGES.academyFellowship,
} as const;

export const MINISTRY = {
  name: CHURCH.name,
  tagline: CHURCH.tagline,
  anchorScripture: {
    text: 'Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ.',
    ref: 'Titus 2:13',
  },
  mandate: 'To raise a people anchored in hope, rooted in the Word, and ready for His appearing.',
  founded: CHURCH.founded,
  leadPastor: {
    name: CHURCH.leader.name,
    role: CHURCH.leader.title,
    // Placeholder bio: replace with the pastor's own words before launch.
    bio: 'Pastor Gabriel Joseph is the Presiding Pastor of Blessed Hope Gospel Ministry, leading the church from its global headquarters in Calabar with a burden for sound teaching, fervent prayer and raising disciples who carry hope into every sphere of life.',
  },
  social: SOCIAL_LINKS,
};

export const SERVICE_TIMEZONE_NOTE = 'All times are West Africa Time (WAT, GMT+1).';

export interface MinistryArm {
  slug: string;
  name: string;
  summary: string;
  detail: string;
  meets: string;
  image: string;
}

export const MINISTRY_ARMS: MinistryArm[] = [
  {
    slug: 'youth',
    name: 'Youth Church',
    summary: 'A generation on fire for God: worship, Word and real community for ages 13–25.',
    detail:
      'Weekly gatherings, mentoring circles and outreach projects that help young people build an unshakeable faith and discover their purpose.',
    meets: 'Sundays 9:30 AM · Youth Hall',
    image: IMAGES.worship,
  },
  {
    slug: 'campus',
    name: 'Campus Fellowship',
    summary: 'Hope on campus: fellowships on universities and colleges near you.',
    detail:
      'Student-led fellowships with Bible study, prayer and academic support, so students thrive spiritually while they study.',
    meets: 'Weekly on partner campuses',
    image: IMAGES.fellowship,
  },
  {
    slug: 'online',
    name: 'Online Church',
    summary: 'No branch near you? Worship with us live from anywhere in the world.',
    detail:
      'Live services, an online pastor, prayer support and digital small groups so you can belong, wherever you are.',
    meets: 'Every service, live',
    image: IMAGES.sanctuary,
  },
  {
    slug: 'home-cells',
    name: 'Home Cells',
    summary: 'Church in your neighbourhood: small groups that pray, study and care together.',
    detail:
      'Home cells meet weekly across cities for fellowship, Bible study and practical care for one another.',
    meets: 'Tuesdays 6:00 PM · Across neighbourhoods',
    image: IMAGES.study,
  },
  {
    slug: 'women',
    name: 'Women of Hope',
    summary: 'Equipping women to flourish in faith, family and calling.',
    detail:
      'Prayer meetings, mentoring, conferences and outreach that strengthen women in every season of life.',
    meets: 'First Saturday monthly · 10:00 AM',
    image: IMAGES.fellowship,
  },
  {
    slug: 'men',
    name: 'Men of Valour',
    summary: 'Building men of integrity who lead their homes and communities well.',
    detail:
      'Breakfast meetings, accountability groups and service projects for men at every stage of life.',
    meets: 'Second Saturday monthly · 8:00 AM',
    image: IMAGES.worship,
  },
  {
    slug: 'children',
    name: 'Children’s Church',
    summary: 'Safe, joyful, Bible-filled services for children aged 3–12.',
    detail:
      'Age-grouped classes with trained, vetted teachers, running alongside every Sunday service.',
    meets: 'Every Sunday service',
    image: IMAGES.study,
  },
  {
    slug: 'academy',
    name: 'Bible Academy',
    summary: 'Structured discipleship and leadership training for every believer.',
    detail:
      'Foundation classes, a school of ministry and leadership tracks. See the Academy page for current cohorts.',
    meets: 'Termly cohorts',
    image: IMAGES.fellowship,
  },
];

export interface Location {
  region: string;
  city: string;
  name: string;
  address: string;
  serviceTimes: string;
  isHeadquarters?: boolean;
}

export const LOCATIONS: Location[] = [
  {
    region: 'Nigeria',
    city: 'Calabar, Cross River State',
    name: `${CHURCH.name}: Global Headquarters`,
    address: CHURCH_ADDRESS_LINE,
    serviceTimes: 'Sun 7:30 · 9:30 · 11:30 AM · Wed 6 PM (WAT)',
    isHeadquarters: true,
  },
  // Add branches here as they open, e.g.
  // { region: 'Nigeria', city: 'Uyo, Akwa Ibom State', name: 'Blessed Hope Uyo', address: '…', serviceTimes: 'Sun 8:00 AM (WAT)' },
];

export const BELIEFS = [
  { title: 'The Scriptures', text: 'The Bible is the inspired, infallible Word of God and our final authority for faith and life.' },
  { title: 'The Godhead', text: 'One God, eternally existing as Father, Son and Holy Spirit.' },
  { title: 'Salvation', text: 'Salvation is by grace through faith in the finished work of Jesus Christ alone.' },
  { title: 'The Holy Spirit', text: 'The baptism and gifts of the Holy Spirit empower believers for holy living and service.' },
  { title: 'The Church', text: 'The Church is the body of Christ, called to worship, fellowship, discipleship and mission.' },
  { title: 'The Blessed Hope', text: 'The personal, glorious return of our Lord Jesus Christ, for which we watch and prepare.' },
];

export interface NavItem {
  label: string;
  to: string;
  description?: string;
}
export interface NavGroup {
  label: string;
  to?: string;
  children?: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  { label: 'Home', to: '/' },
  {
    label: 'About',
    children: [
      { label: 'Who We Are', to: '/about', description: 'Our story, mandate and leadership' },
      { label: 'What We Believe', to: '/about#beliefs', description: 'Our statement of faith' },
      { label: 'Locations', to: '/locations', description: 'Find a church near you' },
    ],
  },
  {
    label: 'Ministries',
    children: [
      { label: 'All Ministries', to: '/ministries', description: 'Find your place to serve and grow' },
      { label: 'Bible Academy', to: '/academy', description: 'Discipleship & leadership training' },
      { label: 'Online Church', to: '/ministries#online', description: 'Worship with us from anywhere' },
    ],
  },
  {
    label: 'Media',
    children: [
      { label: 'Daily Devotional', to: '/devotionals', description: 'Today’s word for your timezone' },
      { label: 'Sermons & Livestream', to: '/media', description: 'Watch live or catch up' },
      { label: 'Events', to: '/events', description: 'Conventions, services & programmes' },
      { label: 'Resources', to: '/resources', description: 'Prayer guides & care' },
    ],
  },
  {
    label: 'Connect',
    children: [
      { label: 'Plan a Visit', to: '/plan-a-visit', description: 'What to expect on your first Sunday' },
      { label: 'Prayer Request', to: '/prayer', description: 'Let us pray with you' },
      { label: 'Testimonies', to: '/testimonies', description: 'What God is doing' },
      { label: 'New Birth', to: '/new-birth', description: 'Give your life to Jesus' },
    ],
  },
  { label: 'Contact', to: '/contact' },
];

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Card, CardContent, Container, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { Link as RouterLink } from 'react-router-dom';
import { ImageCard, ScriptureBand, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { AddToCalendar, Countdown } from '../../components/site/EventWidgets.tsx';
import { HERO_IMAGES, IMAGES, MINISTRY, MINISTRY_ARMS, SERVICE_TIMES, SERVICE_TIMEZONE_NOTE } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';
import { formatYmd, truncate } from '../../lib/format.ts';
import type { CommunitySubmission, DevotionalTodayResponse, MinistryEvent, Sermon, SiteSettings } from '../../types.ts';

interface HomePageProps {
  settings: SiteSettings | null;
  featuredSermons: Sermon[];
}

interface HeroImage {
  small: string;
  large: string;
  /** object-position, to keep the subject clear of the text on narrow screens. */
  position?: string;
  /** transform-origin for the slow zoom, so each slide drifts a little differently. */
  origin?: string;
}

interface Slide {
  image: HeroImage;
  eyebrow: string;
  title: string;
  text: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
}

export function HomePage({ settings, featuredSermons }: HomePageProps) {
  const [devotional, setDevotional] = useState<DevotionalTodayResponse | null>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(true);
  const [testimonies, setTestimonies] = useState<CommunitySubmission[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<MinistryEvent | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    fetch(`/api/devotionals/today?tz=${encodeURIComponent(tz)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDevotional(d as DevotionalTodayResponse))
      .catch(() => {})
      .finally(() => setLoadingDevotional(false));
    fetch('/api/testimonies')
      .then((r) => (r.ok ? r.json() : { testimonies: [] }))
      .then((d: { testimonies?: CommunitySubmission[] }) => setTestimonies((d.testimonies || []).slice(0, 3)))
      .catch(() => {});
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d: { events?: MinistryEvent[] }) => {
        const upcoming = (d.events || []).filter((e) => new Date(e.startAt).getTime() > Date.now() - 6 * 3_600_000);
        setFeaturedEvent(upcoming.find((e) => e.isCountdownTarget) || upcoming[0] || null);
      })
      .catch(() => {});
  }, []);

  const slides: Slide[] = [
    {
      image: HERO_IMAGES[0],
      eyebrow: 'Welcome home',
      title: 'Welcome to Blessed Hope Gospel Ministry',
      text: 'A family anchored in hope, rooted in the Word, and ready for His appearing. Join us in Calabar or online: wherever you are, there is a place for you here.',
      primary: { label: settings?.liveActive ? 'Watch live now' : 'Livestream', to: '/media' },
      secondary: { label: 'Give online', to: '/give' },
    },
    {
      image: HERO_IMAGES[1],
      eyebrow: `Theme of the month · ${settings?.monthlyScripture || 'Isaiah 32:17–18'}`,
      title: settings?.monthlyTheme || 'Walking in Covenant Rest & Fruitfulness',
      text: settings?.monthlyDeclaration || 'And the work of righteousness shall be peace; and the effect of righteousness quietness and assurance for ever.',
      primary: { label: 'Today’s devotional', to: '/devotionals' },
      secondary: { label: 'Plan a visit', to: '/plan-a-visit' },
    },
    {
      image: HERO_IMAGES[2],
      eyebrow: featuredEvent ? featuredEvent.scheduleLabel : 'Grow with us',
      title: featuredEvent ? featuredEvent.title : 'Find your place to belong',
      text: featuredEvent
        ? featuredEvent.description
        : 'Home cells, youth, campus fellowships and the Bible Academy: there is a ministry for every season of life.',
      primary: featuredEvent ? { label: 'Event details', to: '/events' } : { label: 'Explore ministries', to: '/ministries' },
      secondary: { label: 'Prayer request', to: '/prayer' },
    },
  ];

  return (
    <Box>
      <HeroCarousel slides={slides} />
      <QuickActions />

      {/* Today's devotional, resolved for the visitor's own date */}
      <Section>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 5, md: 8 }, alignItems: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                aspectRatio: '4 / 5',
                borderRadius: 3,
                backgroundImage: `url(${IMAGES.study})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              role="img"
              aria-label="An open Bible on a table"
            />
            <Box
              sx={{
                position: 'absolute',
                right: { xs: 16, md: -28 },
                bottom: 28,
                bgcolor: brand.navy,
                color: brand.white,
                px: 3,
                py: 2.25,
                borderRadius: 2,
                borderLeft: `4px solid ${brand.gold}`,
                boxShadow: '0 18px 40px rgba(6,20,43,0.3)',
              }}
            >
              <Typography variant="overline" sx={{ color: brand.gold, lineHeight: 1.4, display: 'block' }}>
                Your date
              </Typography>
              <Typography sx={{ fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.5rem', lineHeight: 1 }}>
                {devotional ? formatYmd(devotional.visitorLocalDate) : '—'}
              </Typography>
            </Box>
          </Box>

          <Box>
            <SectionHeading eyebrow="Daily devotional" title="Today’s word for you" />
            {loadingDevotional ? (
              <Stack spacing={1.5}>
                <Skeleton variant="text" width="70%" height={48} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rectangular" height={120} />
              </Stack>
            ) : devotional?.todayDevotional ? (
              <>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, color: brand.navy, mt: -2 }}>
                  {devotional.todayDevotional.title}
                </Typography>
                <Typography sx={{ color: brand.goldDark, fontWeight: 600, mt: 1, mb: 2.5 }}>
                  {devotional.todayDevotional.scriptureRef}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontStyle: 'italic',
                    fontSize: '1.15rem',
                    lineHeight: 1.7,
                    color: brand.navy,
                    borderLeft: `3px solid ${brand.gold}`,
                    pl: 2.5,
                    mb: 2.5,
                  }}
                >
                  &ldquo;{devotional.todayDevotional.memoryVerse}&rdquo;
                </Typography>
                <Typography sx={{ color: brand.muted, lineHeight: 1.85, mb: 3.5 }}>
                  {truncate(devotional.todayDevotional.body.split('\n\n')[0], 260)}
                </Typography>
                {!devotional.exactDateMatch && (
                  <Typography variant="body2" sx={{ color: brand.muted, mb: 2, fontStyle: 'italic' }}>
                    Today’s devotional is on its way. Here is the most recent one.
                  </Typography>
                )}
                <Button component={RouterLink} to="/devotionals" variant="contained" endIcon={<ArrowForwardIcon />}>
                  Read today’s devotional
                </Button>
              </>
            ) : (
              <Typography sx={{ color: brand.muted, lineHeight: 1.8 }}>
                A fresh devotional is released every day at midnight in your timezone. Check back soon.
              </Typography>
            )}
          </Box>
        </Box>
      </Section>

      {/* Featured event countdown */}
      {featuredEvent && (
        <Box component="section" sx={{ position: 'relative', bgcolor: brand.ink, color: brand.white, overflow: 'hidden' }}>
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${IMAGES.worship})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.22,
            }}
          />
          <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 8, md: 11 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, gap: 5, alignItems: 'center' }}>
              <Box>
                <Typography variant="overline" sx={{ color: brand.gold }}>
                  Upcoming · {featuredEvent.category === 'convention' ? 'Convention' : featuredEvent.category === 'academy' ? 'Academy' : 'Special service'}
                </Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: '2.05rem', md: '2.95rem' }, mt: 0.5 }}>
                  {featuredEvent.title}
                </Typography>
                <Typography sx={{ mt: 1.5, color: brand.gold, fontWeight: 600 }}>{featuredEvent.scheduleLabel}</Typography>
                <Typography sx={{ mt: 0.5, color: 'rgba(255,255,255,0.7)' }}>{featuredEvent.location}</Typography>
                <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, maxWidth: 560 }}>
                  {featuredEvent.description}
                </Typography>
              </Box>
              <Stack spacing={3} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                <Countdown startAt={featuredEvent.startAt} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <AddToCalendar event={featuredEvent} inverted />
                  <Button component={RouterLink} to="/events" variant="contained" color="secondary">
                    All events
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Container>
        </Box>
      )}

      <ScriptureBand text={MINISTRY.anchorScripture.text} reference={MINISTRY.anchorScripture.ref} />

      {/* The mandate */}
      <Section>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 5, md: 9 }, alignItems: 'center' }}>
          <Box>
            <SectionHeading eyebrow="The mandate" title="Anchored in hope. Ready for His appearing." />
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 600, color: brand.navy, mt: -2, mb: 2.5, lineHeight: 1.6 }}>
              {MINISTRY.mandate}
            </Typography>
            <Typography sx={{ color: brand.muted, lineHeight: 1.9, mb: 2 }}>
              Since {MINISTRY.founded}, Blessed Hope Gospel Ministry has gathered people from every walk of life around the
              Word of God, fervent prayer and genuine fellowship. From our global headquarters in Calabar, Cross River
              State, we are one family across many cities, nations and timezones, and we look together for the blessed hope.
            </Typography>
            <Typography sx={{ color: brand.muted, lineHeight: 1.9, mb: 4 }}>
              Under the leadership of {MINISTRY.leadPastor.name}, we teach the whole counsel of God, pray for the
              nations, and equip every believer for life and service.
            </Typography>
            <Button component={RouterLink} to="/about" variant="contained" endIcon={<ArrowForwardIcon />}>
              Learn more
            </Button>
          </Box>
          <Box sx={{ position: 'relative', pb: { md: 6 }, pl: { md: 6 } }}>
            <Box
              aria-hidden
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '70%',
                height: '70%',
                border: `2px solid ${brand.gold}`,
                borderRadius: 3,
              }}
            />
            <Box
              role="img"
              aria-label="Congregation worshipping"
              sx={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: 3,
                backgroundImage: `url(${IMAGES.worship})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </Box>
        </Box>
      </Section>

      {/* Ministries */}
      <Section tone="cream">
        <SectionHeading
          eyebrow="Get involved"
          title="Ministries"
          intro="There is a place for everyone to grow, serve and belong."
          action={{ label: 'All ministries', to: '/ministries' }}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {MINISTRY_ARMS.slice(0, 4).map((arm) => (
            <ImageCard key={arm.slug} image={arm.image} title={arm.name} caption={arm.summary} to={`/ministries#${arm.slug}`} height={400} />
          ))}
        </Box>
      </Section>

      {/* Sermons */}
      {featuredSermons.length > 0 && (
        <Section tone="navy">
          <SectionHeading
            eyebrow="Messages"
            title="Recent sermons"
            inverted
            action={{ label: 'Sermon library', to: '/media' }}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {featuredSermons.map((s) => (
              <Box
                key={s.id}
                component={RouterLink}
                to="/media"
                sx={{
                  color: brand.white,
                  textDecoration: 'none',
                  '&:hover .thumb': { transform: 'scale(1.04)' },
                  '&:hover .play': { bgcolor: brand.gold, color: brand.ink },
                }}
              >
                <Box sx={{ position: 'relative', aspectRatio: '16 / 10', borderRadius: 2, overflow: 'hidden', bgcolor: brand.navyDeep }}>
                  <Box
                    className="thumb"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${s.thumbnailUrl || IMAGES.sanctuary})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 500ms ease',
                    }}
                  />
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)' }} />
                  <Box
                    className="play"
                    sx={{
                      position: 'absolute',
                      left: 16,
                      bottom: 16,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.92)',
                      color: brand.navy,
                      display: 'grid',
                      placeItems: 'center',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <PlayArrowRoundedIcon />
                  </Box>
                  <Typography variant="caption" sx={{ position: 'absolute', right: 14, bottom: 14, bgcolor: 'rgba(0,0,0,0.6)', px: 1, borderRadius: 1 }}>
                    {s.duration}
                  </Typography>
                </Box>
                <Typography variant="overline" sx={{ display: 'block', mt: 2, color: brand.gold }}>
                  {s.series}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.2rem', lineHeight: 1.35 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(255,255,255,0.65)' }}>
                  {s.speaker} · {formatYmd(s.preachedDate)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Section>
      )}

      {/* Testimonies */}
      <Section>
        <SectionHeading
          eyebrow="Testimonies"
          title="What God is doing"
          action={{ label: 'Share your testimony', to: '/testimonies' }}
        />
        {testimonies.length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {testimonies.map((t) => (
              <Card key={t.id} sx={{ bgcolor: brand.cream, border: 'none', height: '100%' }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <FormatQuoteIcon sx={{ color: brand.gold, fontSize: 40, mb: 1 }} />
                  <Typography sx={{ fontWeight: 600, color: brand.navy, mb: 1.5 }}>{t.subject}</Typography>
                  <Typography sx={{ color: brand.muted, lineHeight: 1.8, flex: 1 }}>{truncate(t.message, 220)}</Typography>
                  <Typography variant="body2" sx={{ mt: 3, fontWeight: 600, color: brand.navy }}>
                    {t.fullName}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: brand.muted }}>Testimonies shared by our church family will appear here.</Typography>
        )}
      </Section>

      {/* Service times */}
      <Section tone="cream">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 4, md: 8 }, alignItems: 'start' }}>
          <Box>
            <SectionHeading eyebrow="Worship with us" title="Service times" intro={SERVICE_TIMEZONE_NOTE} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: -2 }}>
              <Button component={RouterLink} to="/plan-a-visit" variant="contained" startIcon={<PlaceOutlinedIcon />}>
                Plan a visit
              </Button>
              <Button component={RouterLink} to="/locations" variant="outlined">
                Find a location
              </Button>
            </Stack>
          </Box>
          <Stack spacing={2}>
            {SERVICE_TIMES.map((s) => (
              <Box
                key={s.day}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '140px 1fr auto' },
                  gap: { xs: 0.5, sm: 3 },
                  alignItems: 'center',
                  bgcolor: brand.white,
                  borderRadius: 2,
                  px: 3,
                  py: 2.5,
                  borderLeft: `4px solid ${brand.gold}`,
                }}
              >
                <Typography sx={{ fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.4rem', color: brand.navy, lineHeight: 1 }}>{s.day}</Typography>
                <Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>
                <Typography sx={{ color: brand.goldDark, fontWeight: 600 }}>{s.times.join(' · ')}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Section>
    </Box>
  );
}

const SLIDE_MS = 7000;
const FADE_MS = 1400;

function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) =>
      setIndex((current) => {
        const target = (next + slides.length) % slides.length;
        if (target !== current) setPrev(current);
        return target;
      }),
    [slides.length]
  );

  // Start the first slide's slow zoom one frame after mount so it animates instead of jumping.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-advance; restarts after manual navigation and stops while the tab is hidden.
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => {
      if (document.visibilityState === 'visible') go(index + 1);
    }, SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, go]);

  // Warm the cache for the next slide's image so it never fades in half-loaded.
  useEffect(() => {
    const next = slides[(index + 1) % slides.length];
    const img = new Image();
    img.sizes = '100vw';
    img.srcset = `${next.image.small} 1280w, ${next.image.large} 2400w`;
  }, [index, slides]);

  return (
    <Box
      component="section"
      aria-roledescription="carousel"
      aria-label="Highlights"
      tabIndex={-1}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1);
        if (e.key === 'ArrowRight') go(index + 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      sx={{
        position: 'relative',
        height: { xs: '92svh', md: '100svh' },
        minHeight: 600,
        maxHeight: 980,
        bgcolor: brand.navyDeep,
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const behind = i === prev;
        const zoomed = (active && ready) || behind;
        return (
          <Box
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={!active}
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: active ? 2 : behind ? 1 : 0,
              // The new slide fades in on top of the previous one, so the screen never dips to dark.
              opacity: active || behind ? 1 : 0,
              transition: active ? `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
              pointerEvents: active ? 'auto' : 'none',
            }}
          >
            <Box
              component="img"
              src={slide.image.small}
              srcSet={`${slide.image.small} 1280w, ${slide.image.large} 2400w`}
              sizes="100vw"
              alt=""
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'low'}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: slide.image.position || 'center',
                transformOrigin: slide.image.origin || 'center',
                // Slow zoom that keeps going while the slide fades out (no snap back).
                transform: zoomed ? 'scale(1.08) translateZ(0)' : 'scale(1) translateZ(0)',
                transition: zoomed ? `transform ${SLIDE_MS + FADE_MS * 2}ms cubic-bezier(0.25, 0.1, 0.25, 1)` : 'none',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
              }}
            />
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(90deg, rgba(6,20,43,0.9) 0%, rgba(6,20,43,0.65) 45%, rgba(6,20,43,0.2) 100%), linear-gradient(0deg, rgba(6,20,43,0.75) 0%, transparent 45%)',
              }}
            />
            <Container maxWidth="lg" sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  maxWidth: 820,
                  color: brand.white,
                  pt: { xs: 6, md: 10 },
                  // Text eases up line by line after the image arrives.
                  '& > *': {
                    opacity: active ? 1 : 0,
                    transform: active ? 'translateY(0)' : 'translateY(18px)',
                    transition: active
                      ? 'opacity 800ms ease var(--delay), transform 900ms cubic-bezier(0.2, 0.7, 0.2, 1) var(--delay)'
                      : 'opacity 250ms ease, transform 0s linear 250ms',
                  },
                }}
              >
                <Typography variant="overline" style={{ '--delay': '350ms' } as React.CSSProperties} sx={{ color: brand.gold, display: 'block', mb: 2 }}>
                  {slide.eyebrow}
                </Typography>
                <Typography
                  component={i === 0 ? 'h1' : 'h2'}
                  style={{ '--delay': '500ms' } as React.CSSProperties}
                  sx={{
                    fontFamily: fonts.display,
                    fontWeight: 800,
                    fontSize: { xs: '2.4rem', sm: '3.25rem', md: '4.25rem' },
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {slide.title}
                </Typography>
                <Typography
                  style={{ '--delay': '650ms' } as React.CSSProperties}
                  sx={{ mt: 3, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', maxWidth: 600 }}
                >
                  {slide.text}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} style={{ '--delay': '800ms' } as React.CSSProperties} sx={{ mt: 4.5 }}>
                  <Button component={RouterLink} to={slide.primary.to} variant="contained" color="secondary" size="large" tabIndex={active ? 0 : -1}>
                    {slide.primary.label}
                  </Button>
                  <Button
                    component={RouterLink}
                    to={slide.secondary.to}
                    variant="outlined"
                    size="large"
                    tabIndex={active ? 0 : -1}
                    sx={{ color: brand.white, borderColor: 'rgba(255,255,255,0.55)', '&:hover': { borderColor: brand.white, bgcolor: 'rgba(255,255,255,0.08)' } }}
                  >
                    {slide.secondary.label}
                  </Button>
                </Stack>
              </Box>
            </Container>
          </Box>
        );
      })}

      {/* Controls */}
      <Container maxWidth="lg" sx={{ position: 'absolute', zIndex: 3, left: 0, right: 0, bottom: { xs: 88, md: 120 }, mx: 'auto' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            sx={{ color: brand.white, border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(4px)' }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {slides.map((_, i) => (
              <Box
                key={i}
                component="button"
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  width: i === index ? 44 : 12,
                  height: 4,
                  p: 0,
                  border: 0,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: 'rgba(255,255,255,0.4)',
                  transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {i === index && (
                  // Fills over the slide's duration. While paused (hover/focus) it shows full,
                  // and restarts together with the timer when the pause ends.
                  <Box
                    key={`${index}-${paused}`}
                    component="span"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: brand.gold,
                      transformOrigin: 'left',
                      animation: paused ? 'none' : `hero-progress ${SLIDE_MS}ms linear forwards`,
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
          <IconButton
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            sx={{ color: brand.white, border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(4px)' }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Container>
    </Box>
  );
}

function QuickActions() {
  const items = [
    { icon: MenuBookIcon, title: 'Daily devotional', text: 'Today’s word, for your timezone', to: '/devotionals' },
    { icon: PlaceOutlinedIcon, title: 'Plan a visit', text: 'We’d love to welcome you', to: '/plan-a-visit' },
    { icon: VolunteerActivismIcon, title: 'Prayer request', text: 'Let us stand with you in prayer', to: '/prayer' },
    { icon: FavoriteBorderIcon, title: 'New birth', text: 'Begin a new life in Christ', to: '/new-birth' },
  ];
  return (
    <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, mt: { xs: -6, md: -8 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          bgcolor: brand.white,
          borderRadius: 3,
          boxShadow: '0 24px 60px rgba(6,20,43,0.16)',
          overflow: 'hidden',
        }}
      >
        {items.map(({ icon: Icon, title, text, to }, i) => (
          <Box
            key={to}
            component={RouterLink}
            to={to}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              textDecoration: 'none',
              color: brand.text,
              borderRight: { md: i < 3 ? `1px solid ${brand.border}` : 'none' },
              borderBottom: { xs: i < 2 ? `1px solid ${brand.border}` : 'none', md: 'none' },
              borderLeft: { xs: i % 2 === 1 ? `1px solid ${brand.border}` : 'none', md: 'none' },
              transition: 'background-color 200ms ease',
              '&:hover': { bgcolor: brand.cream },
              '&:hover .qa-icon': { bgcolor: brand.navy, color: brand.gold },
            }}
          >
            <Box
              className="qa-icon"
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: brand.goldSoft,
                color: brand.goldDark,
                mb: 2,
                transition: 'all 200ms ease',
              }}
            >
              <Icon />
            </Box>
            <Typography sx={{ fontWeight: 700, color: brand.navy, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: brand.muted, mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
              {text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

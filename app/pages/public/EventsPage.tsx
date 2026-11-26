import React, { useEffect, useState } from 'react';
import { Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { PageHero, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { AddToCalendar, Countdown, formatEventDate } from '../../components/site/EventWidgets.tsx';
import { IMAGES } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';
import type { MinistryEvent } from '../../types.ts';

const CATEGORY_LABEL: Record<MinistryEvent['category'], string> = {
  service: 'Service',
  convention: 'Convention',
  academy: 'Academy',
};

export function EventsPage() {
  const [events, setEvents] = useState<MinistryEvent[] | null>(null);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d: { events?: MinistryEvent[] }) => setEvents(d.events || []))
      .catch(() => setEvents([]));
  }, []);

  const now = Date.now();
  const upcoming = (events || []).filter((e) => new Date(e.startAt).getTime() > now - 6 * 3_600_000);
  const past = (events || []).filter((e) => new Date(e.startAt).getTime() <= now - 6 * 3_600_000).reverse();
  const featured = upcoming.find((e) => e.isCountdownTarget) || upcoming[0];

  return (
    <Box>
      <PageHero
        eyebrow="What’s on"
        title="Events"
        subtitle="Conventions, special services and academy sessions. Join us in person or live online."
        image={IMAGES.worship}
      >
        {featured && (
          <Box>
            <Typography variant="overline" sx={{ color: brand.gold }}>
              Next up · {featured.title}
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <Countdown startAt={featured.startAt} />
            </Box>
          </Box>
        )}
      </PageHero>

      <Section>
        <SectionHeading eyebrow="Upcoming" title="Mark your calendar" />
        {events === null ? (
          <Stack spacing={2}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : upcoming.length === 0 ? (
          <Typography sx={{ color: brand.muted }}>No upcoming events right now. Check back soon.</Typography>
        ) : (
          <Stack spacing={2.5}>
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </Stack>
        )}
      </Section>

      {past.length > 0 && (
        <Section tone="cream">
          <SectionHeading eyebrow="Recently" title="Past events" />
          <Stack spacing={2}>
            {past.slice(0, 6).map((e) => (
              <Stack
                key={e.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.5, sm: 3 }}
                sx={{ py: 2, borderBottom: `1px solid ${brand.border}` }}
              >
                <Typography sx={{ minWidth: 200, color: brand.muted }}>{formatEventDate(e.startAt)}</Typography>
                <Typography sx={{ fontWeight: 600, color: brand.navy }}>{e.title}</Typography>
              </Stack>
            ))}
          </Stack>
        </Section>
      )}
    </Box>
  );
}

function EventRow({ event }: { event: MinistryEvent }) {
  const d = new Date(event.startAt);
  const day = new Intl.DateTimeFormat(undefined, { day: '2-digit' }).format(d);
  const month = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(d);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '110px 1fr auto' },
        gap: { xs: 2, md: 4 },
        alignItems: 'center',
        p: { xs: 2.5, md: 3.5 },
        border: `1px solid ${brand.border}`,
        borderRadius: 3,
        transition: 'box-shadow 200ms ease, border-color 200ms ease',
        '&:hover': { borderColor: brand.gold, boxShadow: '0 12px 32px rgba(6,20,43,0.08)' },
      }}
    >
      <Box
        sx={{
          width: { xs: 84, md: 110 },
          py: 1.5,
          textAlign: 'center',
          bgcolor: brand.navy,
          color: brand.white,
          borderRadius: 2,
        }}
      >
        <Typography sx={{ fontFamily: fonts.display, fontSize: { xs: '2.5rem', md: '3.25rem' }, lineHeight: 0.9 }}>{day}</Typography>
        <Typography variant="overline" sx={{ color: brand.gold, lineHeight: 1.6 }}>
          {month}
        </Typography>
      </Box>
      <Box>
        <Chip label={CATEGORY_LABEL[event.category]} size="small" sx={{ bgcolor: brand.goldSoft, color: brand.goldDark, fontWeight: 600, mb: 1 }} />
        <Typography variant="h3" sx={{ fontSize: { xs: '1.3rem', md: '1.55rem' }, color: brand.navy }}>
          {event.title}
        </Typography>
        <Typography sx={{ color: brand.goldDark, fontWeight: 600, mt: 0.5 }}>{event.scheduleLabel}</Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: brand.muted, mt: 0.5 }}>
          <PlaceOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2">{event.location}</Typography>
        </Stack>
        <Typography sx={{ color: brand.muted, mt: 1.5, lineHeight: 1.75, maxWidth: 680 }}>{event.description}</Typography>
      </Box>
      <Box>
        <AddToCalendar event={event} />
      </Box>
    </Box>
  );
}

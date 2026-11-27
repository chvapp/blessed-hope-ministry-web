import React, { useEffect, useState } from 'react';
import { Box, Button, Menu, MenuItem, Stack, Typography } from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { brand, fonts } from '../../theme/muiTheme.ts';
import type { MinistryEvent } from '../../types.ts';

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** Live countdown to an ISO date-time. */
export function Countdown({ startAt, inverted = true }: { startAt: string; inverted?: boolean }) {
  const target = new Date(startAt).getTime();
  const [t, setT] = useState(() => remaining(target));
  useEffect(() => {
    const id = window.setInterval(() => setT(remaining(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (t.done) {
    return (
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <span className="live-dot" />
        <Typography sx={{ fontWeight: 600, color: inverted ? brand.white : brand.navy }}>Happening now</Typography>
      </Stack>
    );
  }

  const units: Array<[number, string]> = [
    [t.days, 'Days'],
    [t.hours, 'Hrs'],
    [t.minutes, 'Mins'],
    [t.seconds, 'Secs'],
  ];
  return (
    <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} role="timer" aria-label="Time until event starts">
      {units.map(([value, label]) => (
        <Box
          key={label}
          sx={{
            minWidth: { xs: 64, sm: 80 },
            py: 1.5,
            px: 1,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: inverted ? 'rgba(255,255,255,0.08)' : brand.white,
            border: `1px solid ${inverted ? 'rgba(255,255,255,0.16)' : brand.border}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em',
              fontSize: { xs: '1.65rem', sm: '2.05rem' },
              lineHeight: 1,
              color: inverted ? brand.white : brand.navy,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(value).padStart(2, '0')}
          </Typography>
          <Typography
            variant="caption"
            sx={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: inverted ? brand.gold : brand.goldDark }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function toIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** "Add to calendar" menu: Google, Outlook.com, and a downloadable .ics for Apple/Outlook apps. */
export function AddToCalendar({
  event,
  durationHours = 3,
  inverted = false,
}: {
  event: MinistryEvent;
  durationHours?: number;
  inverted?: boolean;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const start = new Date(event.startAt);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  const details = `${event.description}\n\n${event.scheduleLabel}`;

  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${toIcsDate(start)}/${toIcsDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    event.location
  )}`;
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${encodeURIComponent(
    event.title
  )}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(
    end.toISOString()
  )}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(event.location)}`;

  const downloadIcs = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Blessed Hope Gospel Ministry//Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@blessedhopeministry`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${icsEscape(event.title)}`,
      `DESCRIPTION:${icsEscape(details)}`,
      `LOCATION:${icsEscape(event.location)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setAnchor(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<EventOutlinedIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={
          inverted
            ? { color: brand.white, borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: brand.white } }
            : undefined
        }
        aria-haspopup="menu"
      >
        Add to calendar
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem component="a" href={google} target="_blank" rel="noopener noreferrer" onClick={() => setAnchor(null)}>
          Google Calendar
        </MenuItem>
        <MenuItem onClick={downloadIcs}>Apple Calendar (.ics)</MenuItem>
        <MenuItem onClick={downloadIcs}>Outlook app (.ics)</MenuItem>
        <MenuItem component="a" href={outlook} target="_blank" rel="noopener noreferrer" onClick={() => setAnchor(null)}>
          Outlook.com
        </MenuItem>
      </Menu>
    </>
  );
}

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

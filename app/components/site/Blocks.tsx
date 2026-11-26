import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import { brand, fonts } from '../../theme/muiTheme.ts';

/** Full-bleed photo banner used at the top of every inner page. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image: string;
  children?: React.ReactNode;
}) {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        color: brand.white,
        bgcolor: brand.navyDeep,
        overflow: 'hidden',
        pt: { xs: 16, md: 20 },
        pb: { xs: 8, md: 11 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, rgba(6,20,43,0.78) 0%, rgba(6,20,43,0.62) 45%, rgba(6,20,43,0.9) 100%)`,
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        {eyebrow && (
          <Typography variant="overline" sx={{ color: brand.gold, display: 'block', mb: 1.5 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: '3rem', sm: '4rem', md: '5.25rem' }, color: brand.white, maxWidth: '18ch' }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              mt: 2.5,
              maxWidth: '60ch',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.75,
              color: 'rgba(255,255,255,0.82)',
            }}
          >
            {subtitle}
          </Typography>
        )}
        {children && <Box sx={{ mt: 4 }}>{children}</Box>}
      </Container>
    </Box>
  );
}

/** Eyebrow + display title + optional intro, used to open each section. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  inverted = false,
  action,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: 'left' | 'center';
  inverted?: boolean;
  action?: { label: string; to: string };
}) {
  return (
    <Stack
      direction={{ xs: 'column', md: action ? 'row' : 'column' }}
      spacing={2}
      sx={{
        mb: { xs: 4, md: 6 },
        justifyContent: 'space-between',
        alignItems: action ? { md: 'flex-end' } : align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
      }}
    >
      <Box sx={{ maxWidth: align === 'center' ? 760 : 680 }}>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{
              color: brand.gold,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.25,
              mb: 1,
              '&::before': {
                content: '""',
                width: 28,
                height: 2,
                bgcolor: brand.gold,
                display: align === 'center' ? 'none' : 'block',
              },
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            color: inverted ? brand.white : brand.navy,
          }}
        >
          {title}
        </Typography>
        {intro && (
          <Typography
            sx={{
              mt: 2,
              color: inverted ? 'rgba(255,255,255,0.75)' : brand.muted,
              lineHeight: 1.8,
              fontSize: '1.02rem',
            }}
          >
            {intro}
          </Typography>
        )}
      </Box>
      {action && (
        <Button
          component={RouterLink}
          to={action.to}
          variant="outlined"
          color={inverted ? 'inherit' : 'primary'}
          endIcon={<ArrowForwardIcon />}
          sx={{ flexShrink: 0, color: inverted ? brand.white : undefined }}
        >
          {action.label}
        </Button>
      )}
    </Stack>
  );
}

/** Vertical rhythm wrapper for a page section. */
export function Section({
  children,
  tone = 'white',
  id,
  py,
}: {
  children: React.ReactNode;
  tone?: 'white' | 'cream' | 'navy' | 'ink';
  id?: string;
  py?: object;
}) {
  const bg = { white: brand.white, cream: brand.cream, navy: brand.navy, ink: brand.ink }[tone];
  const dark = tone === 'navy' || tone === 'ink';
  return (
    <Box
      component="section"
      id={id}
      sx={{
        bgcolor: bg,
        color: dark ? brand.white : brand.text,
        py: py ?? { xs: 8, md: 12 },
        scrollMarginTop: 96,
      }}
    >
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}

/** Large centred scripture quote. */
export function ScriptureBand({ text, reference }: { text: string; reference: string }) {
  return (
    <Box component="section" sx={{ bgcolor: brand.cream, py: { xs: 8, md: 11 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography
          aria-hidden
          sx={{ fontFamily: fonts.serif, fontSize: '5rem', lineHeight: 0.5, color: brand.gold, mb: 2 }}
        >
          &ldquo;
        </Typography>
        <Typography
          component="blockquote"
          sx={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: { xs: '1.4rem', md: '1.9rem' },
            lineHeight: 1.5,
            color: brand.navy,
            m: 0,
          }}
        >
          {text}
        </Typography>
        <Typography variant="overline" sx={{ display: 'block', mt: 3, color: brand.goldDark }}>
          {reference}
        </Typography>
      </Container>
    </Box>
  );
}

/** "Join us online" closing band shown at the bottom of every public page. */
export function JoinOnlineBand() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        bgcolor: brand.navy,
        color: brand.white,
        py: { xs: 8, md: 10 },
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          right: { xs: -120, md: -60 },
          top: '50%',
          width: 420,
          height: 420,
          transform: 'translateY(-50%)',
          borderRadius: '50%',
          border: `2px solid ${brand.gold}`,
          opacity: 0.18,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={4}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="overline" sx={{ color: brand.gold }}>
              Church without walls
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.25rem' }, mt: 0.5 }}>
              Join us online this week
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
              No branch near you? Worship with us live every service, wherever you are in the world.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexShrink: 0 }}>
            <Button component={RouterLink} to="/media" variant="contained" color="secondary" size="large">
              Join us live
            </Button>
            <Button
              component={RouterLink}
              to="/locations"
              variant="outlined"
              size="large"
              sx={{ color: brand.white, borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: brand.white } }}
            >
              Find a location
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

/** Photo card with dark gradient overlay and title, used for ministries/links. */
export function ImageCard({
  image,
  title,
  caption,
  to,
  height = 360,
}: {
  image: string;
  title: string;
  caption?: string;
  to: string;
  height?: number;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        position: 'relative',
        display: 'block',
        height,
        borderRadius: 2.5,
        overflow: 'hidden',
        color: brand.white,
        textDecoration: 'none',
        bgcolor: brand.navyDeep,
        '&:hover .img, &:focus-visible .img': { transform: 'scale(1.06)' },
        '&:hover .arrow, &:focus-visible .arrow': { transform: 'translateX(4px)', color: brand.gold },
        '&:focus-visible': { outline: `3px solid ${brand.gold}`, outlineOffset: 3 },
      }}
    >
      <Box
        className="img"
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 600ms ease',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.05) 100%)',
        }}
      />
      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: 3 }}>
        <Typography sx={{ fontFamily: fonts.display, fontSize: '2rem', letterSpacing: '0.03em', lineHeight: 1 }}>
          {title}
        </Typography>
        {caption && (
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            {caption}
          </Typography>
        )}
        <ArrowForwardIcon className="arrow" sx={{ mt: 1.5, transition: 'all 200ms ease' }} />
      </Box>
    </Box>
  );
}

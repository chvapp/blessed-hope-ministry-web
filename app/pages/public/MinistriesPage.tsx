import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Link as RouterLink } from 'react-router-dom';
import { ImageCard, PageHero, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { IMAGES, MINISTRY_ARMS } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';

export function MinistriesPage() {
  return (
    <Box>
      <PageHero
        eyebrow="Get involved"
        title="Ministries"
        subtitle="Every believer has a place to grow, serve and belong. Find the ministry that fits your season of life."
        image={IMAGES.fellowship}
      />

      <Section>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {MINISTRY_ARMS.map((arm) => (
            <ImageCard key={arm.slug} image={arm.image} title={arm.name} to={`#${arm.slug}`} height={280} />
          ))}
        </Box>
      </Section>

      {MINISTRY_ARMS.map((arm, i) => (
        <Section key={arm.slug} id={arm.slug} tone={i % 2 === 0 ? 'cream' : 'white'} py={{ xs: 7, md: 9 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 4, md: 8 },
              alignItems: 'center',
            }}
          >
            <Box
              role="img"
              aria-label={arm.name}
              sx={{
                order: { md: i % 2 === 0 ? 0 : 1 },
                aspectRatio: '16 / 11',
                borderRadius: 3,
                backgroundImage: `url(${arm.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <Box>
              <Typography sx={{ fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem', color: brand.gold, lineHeight: 1 }}>
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <SectionHeading title={arm.name} />
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: brand.navy, mt: -2, mb: 2, lineHeight: 1.6 }}>
                {arm.summary}
              </Typography>
              <Typography sx={{ color: brand.muted, lineHeight: 1.9, mb: 3 }}>{arm.detail}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: brand.goldDark, mb: 3.5 }}>
                <AccessTimeIcon fontSize="small" />
                <Typography sx={{ fontWeight: 600 }}>{arm.meets}</Typography>
              </Stack>
              {arm.slug === 'academy' ? (
                <Button component={RouterLink} to="/academy" variant="contained">
                  Visit the Academy
                </Button>
              ) : arm.slug === 'online' ? (
                <Button component={RouterLink} to="/media" variant="contained">
                  Join online
                </Button>
              ) : (
                <Button component={RouterLink} to="/contact" variant="contained">
                  Get connected
                </Button>
              )}
            </Box>
          </Box>
        </Section>
      ))}
    </Box>
  );
}

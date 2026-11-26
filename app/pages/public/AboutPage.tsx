import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import { PageHero, ScriptureBand, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { LogoMark } from '../../components/site/Logo.tsx';
import { BELIEFS, IMAGES, LOCATIONS, MINISTRY } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';

const MILESTONES = [
  { year: MINISTRY.founded, text: 'Blessed Hope Ministry begins as a small prayer fellowship of 30 believers.' },
  { year: '2014', text: 'Our first sanctuary is dedicated and the Bible Academy launches its foundation class.' },
  { year: '2019', text: 'Online Church begins, carrying every service live to members around the world.' },
  { year: '2024', text: 'Branches open in North America, Europe and Oceania.' },
];

const VALUES = [
  { title: 'The Word', text: 'Scripture is the foundation of everything we teach and do.' },
  { title: 'Prayer', text: 'We are a praying church, for our families, our cities and the nations.' },
  { title: 'Family', text: 'We belong to one another: no one stands alone.' },
  { title: 'Hope', text: 'We live with joyful expectation of Christ’s appearing.' },
];

export function AboutPage() {
  return (
    <Box>
      <PageHero
        eyebrow="About us"
        title="A people anchored in hope"
        subtitle="The story of a church that was raised to teach the Word, pray for the nations and prepare a people for the appearing of our Lord Jesus Christ."
        image={IMAGES.worship}
      />

      {/* Who we are */}
      <Section>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 5, md: 9 }, alignItems: 'center' }}>
          <Box>
            <SectionHeading eyebrow="Who we are" title="One family, many nations" />
            <Typography sx={{ color: brand.muted, lineHeight: 1.9, mt: -2, mb: 2 }}>
              Blessed Hope Ministry began in {MINISTRY.founded} as a small prayer fellowship with a simple burden: to
              know God through His Word and make Him known. Today we are a growing family of local churches, home
              cells and online members across Africa, North America, Europe and Oceania.
            </Typography>
            <Typography sx={{ color: brand.muted, lineHeight: 1.9 }}>
              Our name comes from Titus 2:13: we live <em>“looking for that blessed hope.”</em> That expectation
              shapes how we worship, how we love one another, and how we serve our communities.
            </Typography>
            <Box
              sx={{
                mt: 4,
                p: 3,
                bgcolor: brand.cream,
                borderRadius: 2,
                borderLeft: `4px solid ${brand.gold}`,
              }}
            >
              <Typography variant="overline" sx={{ color: brand.goldDark }}>
                Our mandate
              </Typography>
              <Typography sx={{ fontWeight: 600, color: brand.navy, fontSize: '1.15rem', lineHeight: 1.6 }}>
                {MINISTRY.mandate}
              </Typography>
            </Box>
          </Box>
          <Box
            role="img"
            aria-label="Church sanctuary"
            sx={{
              aspectRatio: '4 / 5',
              borderRadius: 3,
              backgroundImage: `url(${IMAGES.sanctuary})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </Box>
      </Section>

      {/* Leadership */}
      <Section tone="navy" id="leadership">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 5, md: 9 }, alignItems: 'center' }}>
          <Box
            sx={{
              aspectRatio: '4 / 5',
              borderRadius: 3,
              bgcolor: brand.navyDeep,
              border: `1px solid rgba(255,255,255,0.12)`,
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <LogoMark size={140} />
            <Typography
              variant="caption"
              sx={{ position: 'absolute', bottom: 16, color: 'rgba(255,255,255,0.5)' }}
            >
              Pastor’s photo goes here
            </Typography>
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: brand.gold }}>
              {MINISTRY.leadPastor.role}
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2.75rem', md: '3.75rem' }, mt: 0.5 }}>
              {MINISTRY.leadPastor.name}
            </Typography>
            <Typography sx={{ mt: 3, color: 'rgba(255,255,255,0.8)', lineHeight: 1.9, fontSize: '1.05rem' }}>
              {MINISTRY.leadPastor.bio}
            </Typography>
            <Typography
              sx={{
                mt: 4,
                fontFamily: fonts.serif,
                fontStyle: 'italic',
                fontSize: '1.3rem',
                color: brand.gold,
                lineHeight: 1.6,
              }}
            >
              “Hope is not wishful thinking. It is an anchor, sure and steadfast.”
            </Typography>
          </Box>
        </Box>
      </Section>

      {/* History */}
      <Section>
        <SectionHeading eyebrow="Our journey" title="How God has led us" align="center" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {MILESTONES.map((m) => (
            <Box key={m.year} sx={{ borderTop: `3px solid ${brand.gold}`, pt: 2.5 }}>
              <Typography sx={{ fontFamily: fonts.display, fontSize: '3rem', color: brand.navy, lineHeight: 1 }}>{m.year}</Typography>
              <Typography sx={{ mt: 1.5, color: brand.muted, lineHeight: 1.75 }}>{m.text}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      <ScriptureBand
        text="And I say also unto thee, That thou art Peter, and upon this rock I will build my church; and the gates of hell shall not prevail against it."
        reference="Matthew 16:18"
      />

      {/* Values */}
      <Section>
        <SectionHeading eyebrow="You will love it here" title="What shapes us" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {VALUES.map((v, i) => (
            <Box key={v.title} sx={{ p: 3.5, borderRadius: 2, bgcolor: i % 2 ? brand.cream : brand.navy, color: i % 2 ? brand.text : brand.white }}>
              <Typography sx={{ fontFamily: fonts.display, fontSize: '2.2rem', lineHeight: 1, color: i % 2 ? brand.navy : brand.gold }}>
                {v.title}
              </Typography>
              <Typography sx={{ mt: 1.5, lineHeight: 1.75, color: i % 2 ? brand.muted : 'rgba(255,255,255,0.8)' }}>{v.text}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* Beliefs */}
      <Section tone="cream" id="beliefs">
        <SectionHeading eyebrow="Statement of faith" title="What we believe" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 6, rowGap: 0 }}>
          {BELIEFS.map((b, i) => (
            <Stack key={b.title} direction="row" spacing={2.5} sx={{ py: 3, borderBottom: `1px solid ${brand.border}` }}>
              <Typography sx={{ fontFamily: fonts.display, fontSize: '1.8rem', color: brand.gold, lineHeight: 1, minWidth: 36 }}>
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 700, color: brand.navy }}>{b.title}</Typography>
                <Typography sx={{ mt: 0.5, color: brand.muted, lineHeight: 1.75 }}>{b.text}</Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Section>

      {/* Join */}
      <Section>
        <Box sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto' }}>
          <SectionHeading
            eyebrow="Join us"
            title="There’s a seat for you"
            align="center"
            intro={`Worship with us in person at any of our ${LOCATIONS.length} locations, or online from anywhere. Our home cells meet weekly in neighbourhoods across our cities.`}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center', mt: -2 }}>
            <Button component={RouterLink} to="/plan-a-visit" variant="contained" endIcon={<ArrowForwardIcon />}>
              Worship with us
            </Button>
            <Button component={RouterLink} to="/locations" variant="outlined">
              Find a location
            </Button>
          </Stack>
        </Box>
      </Section>
    </Box>
  );
}

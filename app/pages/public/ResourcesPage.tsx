import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { PageHero, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { IMAGES } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';
import type { SiteSettings } from '../../types.ts';

const GUIDES = [
  {
    title: 'Monthly focus & declarations',
    meta: 'Monthly study guide',
    summary: 'Scripture confessions and meditation verses aligned with this month’s theme, for morning and evening devotion.',
  },
  {
    title: 'Prayer outline for families & cities',
    meta: 'Weekly prayer bulletin',
    summary: 'Structured prayer points for spiritual renewal, household peace, national leaders and global missions.',
  },
  {
    title: 'New believer foundations',
    meta: '14-day discipleship guide',
    summary: 'Assurance of salvation, building a Bible-reading habit, water baptism and finding your church family.',
  },
];

const CARE_LINKS = [
  { icon: VolunteerActivismIcon, title: 'Prayer request', text: 'Our intercessors will pray with you.', to: '/prayer' },
  { icon: FormatQuoteIcon, title: 'Share a testimony', text: 'Tell us what God has done.', to: '/testimonies' },
  { icon: FavoriteBorderIcon, title: 'New birth', text: 'Begin a new life in Christ.', to: '/new-birth' },
  { icon: PlaceOutlinedIcon, title: 'Plan a visit', text: 'We’ll be ready to welcome you.', to: '/plan-a-visit' },
];

export function ResourcesPage({ settings }: { settings: SiteSettings | null }) {
  return (
    <Box>
      <PageHero
        eyebrow="Resources"
        title="Prayer guides & care"
        subtitle="Monthly prayer focus, study guides and pastoral care to strengthen your walk with God."
        image={IMAGES.study}
      />

      <Section>
        <Box sx={{ p: { xs: 4, md: 6 }, bgcolor: brand.navy, color: brand.white, borderRadius: 3, mb: { xs: 8, md: 10 } }}>
          <Typography variant="overline" sx={{ color: brand.gold }}>
            This month · {settings?.monthlyScripture || 'Isaiah 32:17–18'}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, mt: 0.5 }}>
            {settings?.monthlyTheme || 'Walking in Covenant Rest & Fruitfulness'}
          </Typography>
          <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: '1.2rem', lineHeight: 1.7, mt: 2, maxWidth: 760, color: 'rgba(255,255,255,0.85)' }}>
            “{settings?.monthlyDeclaration || 'And the work of righteousness shall be peace; and the effect of righteousness quietness and assurance for ever.'}”
          </Typography>
          <Button component={RouterLink} to="/devotionals" variant="contained" color="secondary" startIcon={<MenuBookIcon />} sx={{ mt: 4 }}>
            Today’s devotional
          </Button>
        </Box>

        <SectionHeading eyebrow="Study & prayer" title="Guides" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {GUIDES.map((g) => (
            <Box key={g.title} sx={{ p: 4, border: `1px solid ${brand.border}`, borderRadius: 3, borderTop: `4px solid ${brand.gold}` }}>
              <Typography variant="overline" sx={{ color: brand.goldDark }}>
                {g.meta}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: brand.navy, fontSize: '1.15rem', mt: 0.5 }}>{g.title}</Typography>
              <Typography sx={{ color: brand.muted, lineHeight: 1.75, mt: 1.5 }}>{g.summary}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 2.5, color: brand.muted, fontStyle: 'italic' }}>
                Available from the church office
              </Typography>
            </Box>
          ))}
        </Box>
      </Section>

      <Section tone="cream">
        <SectionHeading eyebrow="Pastoral care" title="We’re here for you" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {CARE_LINKS.map(({ icon: Icon, title, text, to }) => (
            <Stack
              key={to}
              component={RouterLink}
              to={to}
              spacing={1.5}
              sx={{ p: 3.5, bgcolor: brand.white, borderRadius: 3, textDecoration: 'none', color: brand.text, transition: 'transform 200ms ease', '&:hover': { transform: 'translateY(-4px)' } }}
            >
              <Icon sx={{ color: brand.goldDark, fontSize: 32 }} />
              <Typography sx={{ fontWeight: 700, color: brand.navy }}>{title}</Typography>
              <Typography variant="body2" sx={{ color: brand.muted }}>
                {text}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Section>
    </Box>
  );
}

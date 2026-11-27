import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import EmojiPeopleOutlinedIcon from '@mui/icons-material/EmojiPeopleOutlined';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';
import { PageHero, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { CommunityForm } from '../../components/site/CommunityForm.tsx';
import { IMAGES, SERVICE_TIMES, SERVICE_TIMEZONE_NOTE } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';

const EXPECT = [
  { icon: EmojiPeopleOutlinedIcon, title: 'A warm welcome', text: 'Our hospitality team will meet you at the door and help you find a seat.' },
  { icon: AccessTimeIcon, title: 'About 2 hours', text: 'Each service includes worship, the Word, prayer and fellowship.' },
  { icon: ChildCareIcon, title: 'Kids are covered', text: 'Children’s Church runs during every service in a safe, fun space.' },
  { icon: DirectionsOutlinedIcon, title: 'Easy parking', text: 'Free parking is available on-site, with ushers to guide you.' },
];

export function PlanVisitPage() {
  return (
    <Box>
      <PageHero
        eyebrow="Plan a visit"
        title="We’d love to meet you"
        subtitle="Whether it’s your first time in church or you’re looking for a new church home, here’s what to expect when you visit us in Calabar."
        image={IMAGES.sanctuary}
      />

      <Section>
        <SectionHeading eyebrow="Your first Sunday" title="What to expect" align="center" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {EXPECT.map(({ icon: Icon, title, text }) => (
            <Box key={title} sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: '50%', bgcolor: brand.goldSoft, color: brand.goldDark, display: 'grid', placeItems: 'center', mb: 2 }}>
                <Icon />
              </Box>
              <Typography sx={{ fontWeight: 700, color: brand.navy }}>{title}</Typography>
              <Typography sx={{ mt: 1, color: brand.muted, lineHeight: 1.75 }}>{text}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      <Section tone="cream">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 5, md: 8 }, alignItems: 'start' }}>
          <Box>
            <SectionHeading eyebrow="Service times" title="Join us this week" intro={SERVICE_TIMEZONE_NOTE} />
            <Stack spacing={2} sx={{ mt: -2 }}>
              {SERVICE_TIMES.map((s) => (
                <Box key={s.day} sx={{ bgcolor: brand.white, p: 2.5, borderRadius: 2, borderLeft: `4px solid ${brand.gold}` }}>
                  <Typography sx={{ fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.25rem', color: brand.navy, lineHeight: 1 }}>{s.day}</Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{s.name}</Typography>
                  <Typography sx={{ color: brand.goldDark, fontWeight: 600 }}>{s.times.join(' · ')}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
          <Box sx={{ bgcolor: brand.white, p: { xs: 3, md: 4.5 }, borderRadius: 3 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.65rem', md: '2.05rem' }, color: brand.navy }}>
              Let us know you’re coming
            </Typography>
            <Typography sx={{ color: brand.muted, mt: 1, mb: 3, lineHeight: 1.75 }}>
              Tell us when you plan to visit and we’ll have someone ready to welcome you.
            </Typography>
            <CommunityForm
              type="first_timer"
              subjectLabel="Which service?"
              subjectOptions={SERVICE_TIMES.flatMap((s) => s.times.map((t) => `${s.day} ${t}: ${s.name}`))}
              messageLabel="Anything we should know? (e.g. coming with family, accessibility needs)"
              submitLabel="Plan my visit"
              successMessage="Wonderful! We look forward to welcoming you. Someone from our team will be in touch."
              minRows={3}
            />
          </Box>
        </Box>
      </Section>
    </Box>
  );
}

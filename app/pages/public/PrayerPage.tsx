import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { PageHero, ScriptureBand, Section } from '../../components/site/Blocks.tsx';
import { CommunityForm } from '../../components/site/CommunityForm.tsx';
import { IMAGES, SERVICE_TIMES } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';

export function PrayerPage() {
  const prayerHour = SERVICE_TIMES.find((s) => s.name.toLowerCase().includes('prayer'));
  return (
    <Box>
      <PageHero
        eyebrow="Prayer request"
        title="We will pray with you"
        subtitle="Whatever you are facing, you don’t have to face it alone. Our intercessors pray over every request we receive."
        image={IMAGES.study}
      />

      <Section>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: { xs: 5, md: 8 }, alignItems: 'start' }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.85rem', md: '2.4rem' }, color: brand.navy, mb: 3 }}>
              Send a prayer request
            </Typography>
            <CommunityForm
              type="prayer"
              subjectLabel="Prayer focus"
              subjectOptions={['Healing', 'Family', 'Finances & career', 'Salvation of a loved one', 'Guidance', 'Thanksgiving', 'Other']}
              messageLabel="How can we pray for you?"
              submitLabel="Send prayer request"
              successMessage="Your request has been received. Our prayer team is standing with you."
              minRows={6}
            />
          </Box>
          <Stack spacing={3}>
            <Box sx={{ p: 4, bgcolor: brand.navy, color: brand.white, borderRadius: 3 }}>
              <Typography sx={{ fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.65rem', lineHeight: 1 }}>Hour of prayer</Typography>
              <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
                Join our intercessors in person or online{prayerHour ? ` every ${prayerHour.day} at ${prayerHour.times[0]} (WAT)` : ''}.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ p: 3, bgcolor: brand.cream, borderRadius: 3 }}>
              <LockOutlinedIcon sx={{ color: brand.goldDark }} />
              <Typography variant="body2" sx={{ color: brand.muted, lineHeight: 1.75 }}>
                Your request is confidential. It is only seen by our pastoral and prayer team and is never published.
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Section>

      <ScriptureBand
        text="Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God."
        reference="Philippians 4:6"
      />
    </Box>
  );
}

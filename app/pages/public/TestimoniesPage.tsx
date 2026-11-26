import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { PageHero, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { CommunityForm } from '../../components/site/CommunityForm.tsx';
import { IMAGES } from '../../content/site.ts';
import { brand } from '../../theme/muiTheme.ts';
import type { CommunitySubmission } from '../../types.ts';

export function TestimoniesPage() {
  const [items, setItems] = useState<CommunitySubmission[] | null>(null);

  useEffect(() => {
    fetch('/api/testimonies')
      .then((r) => (r.ok ? r.json() : { testimonies: [] }))
      .then((d: { testimonies?: CommunitySubmission[] }) => setItems(d.testimonies || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <Box>
      <PageHero
        eyebrow="Testimonies"
        title="What God is doing"
        subtitle="Stories of healing, provision, restoration and salvation from our church family around the world."
        image={IMAGES.worship}
      />

      <Section>
        {items === null ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        ) : items.length === 0 ? (
          <Typography sx={{ color: brand.muted }}>Be the first to share what God has done for you.</Typography>
        ) : (
          <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 3 }}>
            {items.map((t) => (
              <Card key={t.id} sx={{ breakInside: 'avoid', mb: 3, bgcolor: brand.cream, border: 'none' }}>
                <CardContent sx={{ p: 4 }}>
                  <FormatQuoteIcon sx={{ color: brand.gold, fontSize: 40 }} />
                  <Typography sx={{ fontWeight: 700, color: brand.navy, mt: 1, mb: 1.5 }}>{t.subject}</Typography>
                  <Typography sx={{ color: brand.muted, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{t.message}</Typography>
                  <Typography variant="body2" sx={{ mt: 3, fontWeight: 600, color: brand.navy }}>
                    {t.fullName}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Section>

      <Section tone="cream" id="share">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 4, md: 8 } }}>
          <SectionHeading
            eyebrow="Share yours"
            title="Submit your testimony"
            intro="Has God answered your prayer? Tell us about it. Testimonies are reviewed by our pastoral team before they are published."
          />
          <Box sx={{ bgcolor: brand.white, p: { xs: 3, md: 4.5 }, borderRadius: 3 }}>
            <CommunityForm
              type="testimony"
              subjectLabel="Title of your testimony"
              messageLabel="Your testimony"
              submitLabel="Submit testimony"
              successMessage="Thank you for sharing! Our team will review your testimony shortly."
              minRows={7}
            />
          </Box>
        </Box>
      </Section>
    </Box>
  );
}

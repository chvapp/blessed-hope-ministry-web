import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { PageHero, Section, SectionHeading } from '../../components/site/Blocks.tsx';
import { CommunityForm } from '../../components/site/CommunityForm.tsx';
import { IMAGES } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';

const STEPS = [
  { ref: 'Romans 3:23', title: 'Everyone needs God', text: 'For all have sinned, and come short of the glory of God.' },
  { ref: 'John 3:16', title: 'God loves you', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { ref: 'Romans 10:9', title: 'Believe and confess', text: 'If thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.' },
  { ref: '2 Corinthians 5:17', title: 'A new beginning', text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.' },
];

export function NewBirthPage() {
  return (
    <Box>
      <PageHero
        eyebrow="New birth"
        title="Begin a new life in Christ"
        subtitle="The greatest decision you will ever make is to receive Jesus Christ as your Lord and Saviour. Here’s how."
        image={IMAGES.worship}
      />

      <Section>
        <SectionHeading eyebrow="The good news" title="God’s plan for you" align="center" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {STEPS.map((s, i) => (
            <Stack key={s.ref} direction="row" spacing={3} sx={{ p: { xs: 3, md: 4 }, bgcolor: brand.cream, borderRadius: 3 }}>
              <Typography sx={{ fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '2.6rem', color: brand.gold, lineHeight: 0.85 }}>{i + 1}</Typography>
              <Box>
                <Typography sx={{ fontWeight: 700, color: brand.navy, fontSize: '1.15rem' }}>{s.title}</Typography>
                <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', color: brand.text, lineHeight: 1.75, mt: 1 }}>
                  “{s.text}”
                </Typography>
                <Typography variant="overline" sx={{ color: brand.goldDark, display: 'block', mt: 1 }}>
                  {s.ref}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Section>

      <Section tone="navy">
        <Box sx={{ maxWidth: 780, mx: 'auto', textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: brand.gold }}>
            Pray this prayer
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.85rem', md: '2.6rem' }, mt: 0.5, mb: 4 }}>
            A prayer of salvation
          </Typography>
          <Typography sx={{ fontFamily: fonts.serif, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}>
            Lord Jesus, I come to You today. I admit that I am a sinner and I need You. I believe You died for my sins
            and rose again from the dead. I ask You to forgive me and come into my heart. I receive You as my Lord and
            Saviour. Thank You for making me a new creation. In Jesus’ name, Amen.
          </Typography>
        </Box>
      </Section>

      <Section tone="cream">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 4, md: 8 } }}>
          <SectionHeading
            eyebrow="Did you pray that prayer?"
            title="Welcome to the family!"
            intro="We would love to celebrate with you, pray with you and help you take your next steps: a new believers’ class, a Bible, and a church family near you."
          />
          <Box sx={{ bgcolor: brand.white, p: { xs: 3, md: 4.5 }, borderRadius: 3 }}>
            <CommunityForm
              type="salvation"
              showSubject={false}
              messageLabel="Tell us a little about yourself and where you’re joining from"
              submitLabel="I gave my life to Jesus"
              successMessage="Hallelujah! Welcome to God’s family. A pastor will reach out to you very soon."
              minRows={4}
            />
          </Box>
        </Box>
      </Section>
    </Box>
  );
}

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { PageHero, Section } from '../../components/site/Blocks.tsx';
import { CommunityForm } from '../../components/site/CommunityForm.tsx';
import { IMAGES, SERVICE_TIMES, SERVICE_TIMEZONE_NOTE } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';
import type { SiteSettings } from '../../types.ts';

export function ContactPage({ settings }: { settings: SiteSettings | null }) {
  const address = settings?.sanctuaryAddress || '14 Covenant Sanctuary Way, Lagos, Nigeria';
  const phone = settings?.contactPhone || '+234 800 555 0194';
  const email = settings?.contactEmail || 'care@blessedhopeministry.org';

  const infoRow = (Icon: typeof PlaceOutlinedIcon, label: string, value: React.ReactNode) => (
    <Stack direction="row" spacing={2}>
      <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', bgcolor: 'rgba(201,162,63,0.15)', color: brand.gold, display: 'grid', placeItems: 'center' }}>
        <Icon fontSize="small" />
      </Box>
      <Box>
        <Typography variant="overline" sx={{ color: brand.gold, lineHeight: 1.6 }}>
          {label}
        </Typography>
        <Box sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.7 }}>{value}</Box>
      </Box>
    </Stack>
  );

  return (
    <Box>
      <PageHero
        eyebrow="Contact"
        title="Blessed Hope Ministry Headquarters"
        subtitle="We’d love to hear from you. Visit us, call us, or send us a message."
        image={IMAGES.sanctuary}
      />

      <Section>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 5, md: 6 }, alignItems: 'start' }}>
          <Box sx={{ bgcolor: brand.navy, color: brand.white, borderRadius: 3, p: { xs: 3.5, md: 4.5 } }}>
            <Typography sx={{ fontFamily: fonts.display, fontSize: '2.4rem', lineHeight: 1, mb: 3.5 }}>Visit us</Typography>
            <Stack spacing={3}>
              {infoRow(PlaceOutlinedIcon, 'Address', address)}
              {infoRow(
                PhoneOutlinedIcon,
                'Phone',
                <Box component="a" href={`tel:${phone.replace(/\s/g, '')}`} sx={{ color: 'inherit', textDecoration: 'none' }}>
                  {phone}
                </Box>
              )}
              {infoRow(
                MailOutlineIcon,
                'Email',
                <Box component="a" href={`mailto:${email}`} sx={{ color: 'inherit', textDecoration: 'none', wordBreak: 'break-all' }}>
                  {email}
                </Box>
              )}
              {infoRow(
                AccessTimeIcon,
                'Service times',
                <Stack spacing={0.5}>
                  {SERVICE_TIMES.map((s) => (
                    <span key={s.day}>
                      <strong>{s.day}</strong>: {s.times.join(', ')}
                    </span>
                  ))}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                    {SERVICE_TIMEZONE_NOTE}
                  </Typography>
                </Stack>
              )}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button
                component="a"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                color="secondary"
                startIcon={<DirectionsOutlinedIcon />}
              >
                Get directions
              </Button>
              <Button component={RouterLink} to="/locations" variant="outlined" sx={{ color: brand.white, borderColor: 'rgba(255,255,255,0.4)' }}>
                Other branches
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.25rem' }, color: brand.navy }}>
              Ask a question
            </Typography>
            <Typography sx={{ color: brand.muted, mt: 1, mb: 3.5, lineHeight: 1.75 }}>
              Send us a message and someone from our team will get back to you within two working days.
            </Typography>
            <CommunityForm
              type="contact"
              subjectLabel="Subject"
              subjectOptions={['General enquiry', 'Counselling', 'Weddings & dedications', 'Partnership & giving', 'Media & press', 'Other']}
              messageLabel="Your message"
              submitLabel="Send message"
              successMessage="Thank you! Your message has been received. We’ll be in touch soon."
            />
          </Box>
        </Box>
      </Section>
    </Box>
  );
}

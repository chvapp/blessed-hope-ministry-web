import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PageHero } from '../../components/site/Blocks.tsx';
import { IMAGES } from '../../content/site.ts';
import { EditorialImage, GENERATED_IMAGES } from '../../components/EditorialImage.tsx';
import type { MinistryEvent } from '../../types.ts';

const ACADEMY_TRACKS = [
  {
    code: 'BHBLI 101',
    title: 'Basic Certificate in Biblical Foundations',
    duration: '2 Weeks Intensive · Online & Sanctuary',
    desc: 'Establishes new and growing believers in salvation, faith, prayer, the Holy Spirit, and daily Scripture habits.',
  },
  {
    code: 'BHBLI 201',
    title: 'Leadership & Ministry Stewardship',
    duration: '2 Weeks Intensive · Hybrid',
    desc: 'Equips fellowship cell leaders, ushers, choir stewards, and marketplace ambassadors for servant leadership.',
  },
  {
    code: 'FAMILY',
    title: 'Christian Family, Marriage & Youth Fellowship',
    duration: 'Monthly Seminars & Mentoring',
    desc: 'Biblical marriage enrichment, parenting wisdom, and young adult mentorship circles across local assemblies.',
  },
];

export function AcademyPage() {
  const [events, setEvents] = useState<MinistryEvent[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [track, setTrack] = useState(ACADEMY_TRACKS[0].title);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((res: { events?: MinistryEvent[] }) => {
        setEvents((res.events || []).filter((e) => e.category === 'academy' || e.category === 'convention'));
      })
      .catch(() => {});
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'academy',
          fullName,
          email,
          phone,
          subject: `Academy Cohort Interest: ${track}`,
          message: notes.trim() || `Interested in enrolling for ${track}.`,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Unable to submit enrollment inquiry.');
      }
      setFeedback({
        type: 'success',
        text: 'Your Academy & Family program registration request has been received. Our admissions team will email cohort details.',
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setNotes('');
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Submission failed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHero
        eyebrow="Bible Academy"
        title="Grow deeper in the Word"
        subtitle="Structured discipleship, family enrichment and leadership training for every stage of spiritual growth."
        image={IMAGES.fellowship}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
            mb: 7,
          }}
        >
          <Box>
            <Typography className="font-prose" sx={{ fontSize: '1.08rem', lineHeight: 1.8, color: '#44403C' }}>
              Modeled as a training sanctuary for believers, families, and emerging leaders, BHBLI pairs systematic Scripture study with practical discipleship and Christian home-building programs.
            </Typography>
          </Box>
          <EditorialImage
            src={GENERATED_IMAGES.academyFellowship}
            alt="Blessed Hope Bible and Leadership Institute Study Hall"
            aspectRatio="4 / 3"
            borderRadius={10}
          />
        </Box>

        {/* Curriculum Tracks */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 7,
          }}
        >
          {ACADEMY_TRACKS.map((item) => (
            <Card key={item.code}>
              <CardContent sx={{ p: 3 }}>
                <Typography className="font-mono-tabular" variant="caption" sx={{ color: '#0B1F3F', fontWeight: 700 }}>
                  {item.code} · {item.duration}
                </Typography>
                <Typography variant="h4" sx={{ fontSize: '1.4rem', mt: 1, mb: 1.25 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {item.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Upcoming Cohorts + Enrollment Form */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' },
            gap: 5,
            alignItems: 'start',
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontSize: '1.9rem', mb: 2 }}>
              Upcoming Sessions &amp; Convocations
            </Typography>
            <Stack spacing={2}>
              {events.map((ev) => (
                <Card key={ev.id}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#A8842A', fontWeight: 700 }}>
                      {ev.category.toUpperCase()} · {ev.scheduleLabel}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, mb: 0.75, fontWeight: 700 }}>
                      {ev.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ev.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h3" sx={{ fontSize: '1.9rem', mb: 1 }}>
                Register Interest for Next Cohort
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete this form to receive the syllabus, schedule options across time zones, and orientation link.
              </Typography>

              {feedback && (
                <Alert severity={feedback.type} sx={{ mb: 2.5 }}>
                  {feedback.text}
                </Alert>
              )}

              <Box component="form" onSubmit={handleEnroll}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    fullWidth
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Email Address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Phone / WhatsApp (Optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    select
                    label="Program Track"
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    fullWidth
                  >
                    {ACADEMY_TRACKS.map((t) => (
                      <MenuItem key={t.code} value={t.title}>
                        {t.title}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Preferred Study Mode or Questions"
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Let us know your timezone or preferred campus format..."
                    fullWidth
                  />
                  <Button type="submit" variant="contained" color="primary" size="large" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Cohort Registration'}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}

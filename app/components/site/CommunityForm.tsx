import React, { useState } from 'react';
import { Alert, Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import type { CommunitySubmissionType } from '../../types.ts';

interface Props {
  type: CommunitySubmissionType;
  submitLabel: string;
  successMessage: string;
  /** Label for the free-text field. */
  messageLabel?: string;
  /** When set, the subject is a select with these options instead of free text. */
  subjectOptions?: string[];
  subjectLabel?: string;
  showSubject?: boolean;
  messagePlaceholder?: string;
  minRows?: number;
}

/** Shared form for prayer requests, testimonies, first-timer visits, salvation and contact. */
export function CommunityForm({
  type,
  submitLabel,
  successMessage,
  messageLabel = 'Message',
  subjectOptions,
  subjectLabel = 'Subject',
  showSubject = true,
  messagePlaceholder,
  minRows = 5,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(subjectOptions?.[0] ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, fullName, email, phone, subject, message }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
      setFeedback({ type: 'success', text: successMessage });
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSubject(subjectOptions?.[0] ?? '');
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} noValidate={false}>
      <Stack spacing={2.25}>
        {feedback && <Alert severity={feedback.type}>{feedback.text}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Full name"
            required
            fullWidth
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Phone (optional)"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          {showSubject &&
            (subjectOptions ? (
              <TextField select label={subjectLabel} fullWidth value={subject} onChange={(e) => setSubject(e.target.value)}>
                {subjectOptions.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField label={subjectLabel} fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} />
            ))}
        </Stack>
        <TextField
          label={messageLabel}
          required
          multiline
          minRows={minRows}
          fullWidth
          value={message}
          placeholder={messagePlaceholder}
          onChange={(e) => setMessage(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 3000 } }}
        />
        <Box>
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? 'Sending…' : submitLabel}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

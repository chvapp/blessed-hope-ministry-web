import React, { useState } from 'react';
import { Alert, Box, Button, Checkbox, Container, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { brand } from '../../theme/muiTheme.ts';

/** Opt-in form so visitors can receive the daily devotional and announcements on WhatsApp. */
export function WhatsAppSignup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, consent, website }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Something went wrong.');
      setMsg({ type: 'success', text: 'You’re in! Look out for messages from Blessed Hope Ministry on WhatsApp.' });
      setName('');
      setPhone('');
      setConsent(false);
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="section" sx={{ bgcolor: brand.cream, py: { xs: 7, md: 9 }, borderTop: `1px solid ${brand.border}` }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 3, md: 6 }, alignItems: 'center' }}>
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#1DA851', color: brand.white, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <WhatsAppIcon />
            </Box>
            <Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '2.1rem', md: '2.6rem' }, color: brand.navy }}>
                Get the devotional on WhatsApp
              </Typography>
              <Typography sx={{ color: brand.muted, mt: 1, lineHeight: 1.75 }}>
                Receive the daily word, service reminders and church announcements on WhatsApp. Reply STOP at any time to unsubscribe.
              </Typography>
            </Box>
          </Stack>
          <Box component="form" onSubmit={submit}>
            {msg && (
              <Alert severity={msg.type} sx={{ mb: 2 }}>
                {msg.text}
              </Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField label="Your name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <TextField
                label="WhatsApp number"
                required
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 123 4567"
                autoComplete="tel"
                slotProps={{ htmlInput: { inputMode: 'tel' } }}
              />
              <Box
                component="input"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={website}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
                sx={{ position: 'absolute', left: -9999, width: 1, height: 1 }}
              />
              <Button type="submit" variant="contained" disabled={busy || !consent} sx={{ flexShrink: 0, bgcolor: '#1DA851', '&:hover': { bgcolor: '#178A43' } }}>
                {busy ? 'Joining…' : 'Subscribe'}
              </Button>
            </Stack>
            <FormControlLabel
              sx={{ mt: 1 }}
              control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} size="small" />}
              label={
                <Typography variant="body2" color="text.secondary">
                  I agree to receive WhatsApp messages from Blessed Hope Ministry.
                </Typography>
              }
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

/** Floating "chat with us" button, shown when the church has set a WhatsApp number. */
export function WhatsAppChatButton({ number }: { number?: string }) {
  const digits = (number || '').replace(/\D/g, '');
  if (!digits) return null;
  return (
    <Box
      component="a"
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      sx={{
        position: 'fixed',
        right: { xs: 16, md: 24 },
        bottom: { xs: 16, md: 24 },
        zIndex: 1200,
        width: 56,
        height: 56,
        borderRadius: '50%',
        bgcolor: '#1DA851',
        color: brand.white,
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        transition: 'transform 200ms ease',
        '&:hover': { transform: 'scale(1.06)' },
      }}
    >
      <WhatsAppIcon sx={{ fontSize: 30 }} />
    </Box>
  );
}

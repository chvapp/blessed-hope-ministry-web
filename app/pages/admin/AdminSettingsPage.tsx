import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { AdminPageHeader } from '../../components/admin/AdminUi.tsx';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { SiteSettings } from '../../types.ts';

export function AdminSettingsPage() {
  const { authFetch } = useAdminAuth();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    authFetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d: { settings: SiteSettings }) => setS(d.settings))
      .catch(() => {});
  }, [authFetch]);

  if (!s) return null;

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS({ ...s, [k]: v });
  const field = (k: keyof SiteSettings, label: string, extra: Partial<React.ComponentProps<typeof TextField>> = {}) => (
    <TextField label={label} value={String(s[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} fullWidth {...extra} />
  );

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await authFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(s) });
    const json = (await res.json()) as { settings?: SiteSettings; error?: string };
    setSaving(false);
    if (!res.ok || !json.settings) {
      setMsg({ type: 'error', text: json.error || 'Unable to save settings.' });
      return;
    }
    setS(json.settings);
    setMsg({ type: 'success', text: 'Settings saved. Changes are live on the website.' });
  };

  const section = (title: string, description: string, children: React.ReactNode) => (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {description}
        </Typography>
        <Stack spacing={2}>{children}</Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <AdminPageHeader
        title="Site settings"
        description="Details shown across the public website."
        actions={
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />
      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {section(
          'Theme of the month',
          'Shown in the homepage slider and the Resources page.',
          <>
            {field('monthlyTheme', 'Theme')}
            {field('monthlyScripture', 'Scripture reference')}
            {field('monthlyDeclaration', 'Scripture text / declaration', { multiline: true, minRows: 3 })}
          </>
        )}
        {section(
          'Livestream',
          'Turn on “Live now” when a service is streaming. Use YouTube embed links (https://www.youtube.com/embed/…).',
          <>
            <FormControlLabel control={<Switch checked={s.liveActive} onChange={(e) => set('liveActive', e.target.checked)} />} label="We are live now" />
            {field('liveTitle', 'Service title')}
            {field('liveStreamEnglishUrl', 'English stream link')}
            {field('liveStreamFrenchUrl', 'French stream link')}
            {field('liveStreamYorubaUrl', 'Yoruba stream link')}
            {field('radioStreamUrl', 'Radio stream link')}
          </>
        )}
        {section(
          'Contact details',
          'Shown in the footer and on the Contact page.',
          <>
            {field('ministryName', 'Ministry name')}
            {field('sanctuaryAddress', 'Headquarters address')}
            {field('contactPhone', 'Phone')}
            {field('contactEmail', 'Email')}
            {field('whatsappNumber', 'WhatsApp number (for the chat button)', { helperText: 'With country code, e.g. +2348031234567' })}
          </>
        )}
        {section(
          'Bank transfer details',
          'Shown on the Give page for members who prefer a direct transfer.',
          <>
            {field('bankName', 'Bank name')}
            {field('bankAccountName', 'Account name')}
            {field('bankAccountNumber', 'Account number')}
          </>
        )}
      </Box>
    </Box>
  );
}

import React, { useRef, useState } from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import { brand } from '../../theme/muiTheme.ts';

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.85rem' } }}>
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: brand.navy, mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/** URL text field with an "Upload" button that stores the image in R2. */
export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const { authFetch } = useAdminAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await authFetch('/api/admin/uploads', { method: 'POST', body: form });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || 'Upload failed.');
      onChange(json.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      {value && (
        <Box
          component="img"
          src={value}
          alt=""
          sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover', flexShrink: 0, border: `1px solid ${brand.border}` }}
        />
      )}
      <TextField
        label={label}
        fullWidth
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… or upload"
        error={Boolean(error)}
        helperText={error || undefined}
      />
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <Button variant="outlined" onClick={() => input.current?.click()} disabled={busy} startIcon={<UploadOutlinedIcon />} sx={{ flexShrink: 0, height: 40 }}>
        {busy ? 'Uploading…' : 'Upload'}
      </Button>
    </Stack>
  );
}

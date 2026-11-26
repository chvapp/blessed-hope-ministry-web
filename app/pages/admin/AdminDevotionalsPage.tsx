import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { Devotional, DevotionalStatus, TimezoneSnapshot } from '../../types.ts';

interface DevotionalFormState {
  id: string | null;
  publishDate: string;
  title: string;
  scriptureRef: string;
  memoryVerse: string;
  propheticFocus: string;
  author: string;
  status: DevotionalStatus;
  body: string;
  prayerPointsText: string;
}

const EMPTY_FORM: DevotionalFormState = {
  id: null,
  publishDate: new Date().toISOString().slice(0, 10),
  title: '',
  scriptureRef: '',
  memoryVerse: '',
  propheticFocus: '',
  author: 'Pastor Gabriel Joseph',
  status: 'published',
  body: '',
  prayerPointsText: '',
};

export function AdminDevotionalsPage() {
  const { authFetch } = useAdminAuth();
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [zones, setZones] = useState<TimezoneSnapshot[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<DevotionalFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadDevotionals = useCallback(async () => {
    const res = await authFetch('/api/admin/devotionals');
    if (res.ok) {
      const json = (await res.json()) as {
        devotionals: Devotional[];
        globalComparison: TimezoneSnapshot[];
      };
      setDevotionals(json.devotionals);
      setZones(json.globalComparison);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadDevotionals();
  }, [loadDevotionals]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (d: Devotional) => {
    setForm({
      id: d.id,
      publishDate: d.publishDate,
      title: d.title,
      scriptureRef: d.scriptureRef,
      memoryVerse: d.memoryVerse,
      propheticFocus: d.propheticFocus,
      author: d.author,
      status: d.status,
      body: d.body,
      prayerPointsText: d.prayerPoints.join('\n'),
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const endpoint = form.id ? `/api/admin/devotionals/${form.id}` : '/api/admin/devotionals';
      const method = form.id ? 'PUT' : 'POST';
      const res = await authFetch(endpoint, {
        method,
        body: JSON.stringify({
          publishDate: form.publishDate,
          title: form.title,
          scriptureRef: form.scriptureRef,
          memoryVerse: form.memoryVerse,
          propheticFocus: form.propheticFocus,
          author: form.author,
          status: form.status,
          body: form.body,
          prayerPoints: form.prayerPointsText,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Unable to save devotional.');
      }
      setDialogOpen(false);
      setToast(form.id ? 'Devotional updated.' : 'Devotional scheduled.');
      await loadDevotionals();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await authFetch(`/api/admin/devotionals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setToast('Devotional removed.');
      await loadDevotionals();
    }
  };

  const filtered = devotionals.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.publishDate.includes(search) ||
      d.scriptureRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.75rem' }}>
            Daily Devotionals Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule devotionals by canonical date (YYYY-MM-DD); each visitor unlocks the reading at their local midnight.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openCreate}>
          Upload Devotional
        </Button>
      </Stack>

      {/* Multi-Timezone Release Simulator */}
      <Card sx={{ border: '1px solid #E5E5E5' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Live Multi-Timezone Visibility Simulator
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 1.5,
            }}
          >
            {zones.map((zone) => {
              const unlocked = devotionals
                .filter((d) => d.status === 'published' && d.publishDate <= zone.localDate)
                .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
              const active = unlocked.find((d) => d.publishDate === zone.localDate) || unlocked[0];
              return (
                <Box
                  key={zone.timeZone}
                  sx={{ p: 1.5, border: '1px solid #E5E5E5', borderRadius: 1.5, bgcolor: '#F7F7F5' }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                    {zone.label}
                  </Typography>
                  <Typography className="font-mono-tabular" variant="caption" sx={{ color: '#0B1F3F', display: 'block' }}>
                    Local Date: {zone.localDate}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {active ? `Reading ${active.publishDate}: ${active.title}` : 'No published entry'}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ border: '1px solid #E5E5E5' }}>
        <CardContent sx={{ p: 2.5 }}>
          <TextField
            size="small"
            placeholder="Filter by date (2026-11-23), title, or scripture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2.5, maxWidth: 380, width: '100%' }}
          />

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Publish Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Scripture</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell className="font-mono-tabular">{item.publishDate}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.title}</TableCell>
                    <TableCell>{item.scriptureRef}</TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell
                      sx={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        color: item.status === 'published' ? '#16A34A' : '#D97706',
                      }}
                    >
                      {item.status}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="Edit devotional" size="small" onClick={() => openEdit(item)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="Delete devotional" size="small" onClick={() => handleDelete(item.id)}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{form.id ? 'Edit Devotional' : 'Upload New Daily Devotional'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Calendar Release Date"
                  type="date"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={form.publishDate}
                  onChange={(e) => setForm((f) => ({ ...f, publishDate: e.target.value }))}
                  fullWidth
                />
                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DevotionalStatus }))}
                  fullWidth
                >
                  <MenuItem value="published">Published (Auto-unlocks by timezone)</MenuItem>
                  <MenuItem value="draft">Draft (Hidden from public)</MenuItem>
                </TextField>
              </Stack>

              <TextField
                label="Devotional Title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Scripture Reference"
                  required
                  placeholder="e.g. Isaiah 60:1–3"
                  value={form.scriptureRef}
                  onChange={(e) => setForm((f) => ({ ...f, scriptureRef: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Prophetic Focus"
                  placeholder="e.g. Radiance Through Obedient Faith"
                  value={form.propheticFocus}
                  onChange={(e) => setForm((f) => ({ ...f, propheticFocus: e.target.value }))}
                  fullWidth
                />
              </Stack>

              <TextField
                label="Memory Verse"
                multiline
                rows={2}
                value={form.memoryVerse}
                onChange={(e) => setForm((f) => ({ ...f, memoryVerse: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Devotional Teaching Body (separate paragraphs with a blank line)"
                required
                multiline
                rows={6}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Prayer Declarations (one per line)"
                multiline
                rows={3}
                value={form.prayerPointsText}
                onChange={(e) => setForm((f) => ({ ...f, prayerPointsText: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Author / Minister"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Devotional'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} message={toast} />
    </Stack>
  );
}

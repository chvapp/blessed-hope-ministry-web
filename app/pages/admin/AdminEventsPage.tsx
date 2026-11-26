import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { AdminPageHeader, ImageField } from '../../components/admin/AdminUi.tsx';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { EventCategory, MinistryEvent } from '../../types.ts';

interface Draft {
  id?: string;
  title: string;
  category: EventCategory;
  startLocal: string; // yyyy-MM-ddTHH:mm in the admin's timezone
  scheduleLabel: string;
  location: string;
  description: string;
  imageUrl: string;
  isCountdownTarget: boolean;
}

const EMPTY: Draft = {
  title: '',
  category: 'service',
  startLocal: '',
  scheduleLabel: '',
  location: 'Main Sanctuary & Online',
  description: '',
  imageUrl: '',
  isCountdownTarget: false,
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminEventsPage() {
  const { authFetch } = useAdminAuth();
  const [events, setEvents] = useState<MinistryEvent[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await authFetch('/api/admin/events');
    if (res.ok) setEvents(((await res.json()) as { events: MinistryEvent[] }).events);
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const payload = { ...draft, startAt: draft.startLocal ? new Date(draft.startLocal).toISOString() : '' };
    const res = await authFetch(draft.id ? `/api/admin/events/${draft.id}` : '/api/admin/events', {
      method: draft.id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(json.error || 'Unable to save event.');
      return;
    }
    setDraft(null);
    void load();
  };

  const remove = async (e: MinistryEvent) => {
    if (!window.confirm(`Delete “${e.title}”?`)) return;
    await authFetch(`/api/admin/events/${e.id}`, { method: 'DELETE' });
    void load();
  };

  const now = Date.now();

  return (
    <Box>
      <AdminPageHeader
        title="Events"
        description="Services, conventions and academy sessions shown on the Events page. Mark one event as the countdown to feature it on the homepage."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDraft({ ...EMPTY })}>
            New event
          </Button>
        }
      />
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Starts</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((e) => {
                const past = new Date(e.startAt).getTime() < now;
                return (
                  <TableRow key={e.id} hover sx={{ opacity: past ? 0.55 : 1 }}>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 600 }}>{e.title}</Typography>
                        {e.isCountdownTarget && <Chip size="small" color="secondary" icon={<TimerOutlinedIcon />} label="Countdown" />}
                        {past && <Chip size="small" label="Past" variant="outlined" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {e.category} · {e.scheduleLabel}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(e.startAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{e.location}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setDraft({
                              id: e.id,
                              title: e.title,
                              category: e.category,
                              startLocal: toLocalInput(e.startAt),
                              scheduleLabel: e.scheduleLabel,
                              location: e.location,
                              description: e.description,
                              imageUrl: e.imageUrl || '',
                              isCountdownTarget: e.isCountdownTarget,
                            })
                          }
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => remove(e)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!events.length && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    No events yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(draft)} onClose={() => setDraft(null)} fullWidth maxWidth="sm">
        <DialogTitle>{draft?.id ? 'Edit event' : 'New event'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {draft && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Title" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Type" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as EventCategory })} sx={{ minWidth: 170 }}>
                  <MenuItem value="service">Service</MenuItem>
                  <MenuItem value="convention">Convention</MenuItem>
                  <MenuItem value="academy">Academy</MenuItem>
                </TextField>
                <TextField
                  label="Starts"
                  type="datetime-local"
                  required
                  fullWidth
                  value={draft.startLocal}
                  onChange={(e) => setDraft({ ...draft, startLocal: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="In your current timezone. Visitors see it converted to theirs."
                />
              </Stack>
              <TextField
                label="Schedule label"
                value={draft.scheduleLabel}
                onChange={(e) => setDraft({ ...draft, scheduleLabel: e.target.value })}
                placeholder="e.g. Dec 10–14 · 6:00 PM WAT nightly"
              />
              <TextField label="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
              <TextField label="Description" multiline minRows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              <ImageField label="Poster / image (optional)" value={draft.imageUrl} onChange={(url) => setDraft({ ...draft, imageUrl: url })} />
              <FormControlLabel
                control={<Switch checked={draft.isCountdownTarget} onChange={(e) => setDraft({ ...draft, isCountdownTarget: e.target.checked })} />}
                label="Feature with a countdown on the homepage"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDraft(null)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

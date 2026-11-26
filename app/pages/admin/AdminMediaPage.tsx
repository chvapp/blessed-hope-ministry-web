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
import StarIcon from '@mui/icons-material/Star';
import { Link as RouterLink } from 'react-router-dom';
import { AdminPageHeader, ImageField } from '../../components/admin/AdminUi.tsx';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { Sermon } from '../../types.ts';

type Draft = Omit<Sermon, 'id' | 'createdAt'> & { id?: string };

const EMPTY: Draft = {
  title: '',
  speaker: '',
  series: '',
  category: 'Teaching',
  mediaType: 'video',
  mediaUrl: '',
  thumbnailUrl: '',
  duration: '',
  preachedDate: new Date().toISOString().slice(0, 10),
  summary: '',
  isFeatured: false,
};

/** Turn a normal YouTube watch/share link into an embeddable one. */
function toEmbed(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

export function AdminMediaPage() {
  const { authFetch, can } = useAdminAuth();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await authFetch('/api/admin/sermons');
    if (res.ok) setSermons(((await res.json()) as { sermons: Sermon[] }).sermons);
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setError(null);
    const res = await authFetch(draft.id ? `/api/admin/sermons/${draft.id}` : '/api/admin/sermons', {
      method: draft.id ? 'PUT' : 'POST',
      body: JSON.stringify({ ...draft, mediaUrl: toEmbed(draft.mediaUrl) }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'Unable to save sermon.');
      return;
    }
    setDraft(null);
    void load();
  };

  const remove = async (s: Sermon) => {
    if (!window.confirm(`Delete “${s.title}”?`)) return;
    await authFetch(`/api/admin/sermons/${s.id}`, { method: 'DELETE' });
    void load();
  };

  return (
    <Box>
      <AdminPageHeader
        title="Sermons"
        description="The sermon library on the Media page. Starred sermons appear on the homepage (up to three)."
        actions={
          <>
            {can('admin') && (
              <Button component={RouterLink} to="/admin/settings" variant="outlined">
                Livestream settings
              </Button>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDraft({ ...EMPTY })}>
              New sermon
            </Button>
          </>
        }
      />
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sermon</TableCell>
                <TableCell>Date</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Series</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {sermons.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      {s.thumbnailUrl && <Box component="img" src={s.thumbnailUrl} alt="" sx={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 1 }} />}
                      <Box>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 600 }}>{s.title}</Typography>
                          {s.isFeatured && <StarIcon fontSize="small" color="secondary" />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {s.speaker} · {s.mediaType} · {s.duration}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{s.preachedDate}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{s.series && <Chip size="small" label={s.series} />}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setDraft({ ...s })}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => remove(s)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!sermons.length && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    No sermons yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(draft)} onClose={() => setDraft(null)} fullWidth maxWidth="sm">
        <DialogTitle>{draft?.id ? 'Edit sermon' : 'New sermon'}</DialogTitle>
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
                <TextField label="Speaker" required fullWidth value={draft.speaker} onChange={(e) => setDraft({ ...draft, speaker: e.target.value })} />
                <TextField
                  label="Date preached"
                  type="date"
                  required
                  value={draft.preachedDate}
                  onChange={(e) => setDraft({ ...draft, preachedDate: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ minWidth: 180 }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Series" fullWidth value={draft.series} onChange={(e) => setDraft({ ...draft, series: e.target.value })} />
                <TextField label="Category" fullWidth value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Type" value={draft.mediaType} onChange={(e) => setDraft({ ...draft, mediaType: e.target.value as Sermon['mediaType'] })} sx={{ minWidth: 140 }}>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                </TextField>
                <TextField label="Duration" placeholder="54:18" value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} />
              </Stack>
              <TextField
                label="Video / audio link"
                value={draft.mediaUrl}
                onChange={(e) => setDraft({ ...draft, mediaUrl: e.target.value })}
                helperText="Paste a YouTube link. It’s converted to an embed automatically."
              />
              <ImageField label="Thumbnail" value={draft.thumbnailUrl} onChange={(url) => setDraft({ ...draft, thumbnailUrl: url })} />
              <TextField label="Summary" multiline minRows={3} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
              <FormControlLabel
                control={<Switch checked={draft.isFeatured} onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })} />}
                label="Feature on the homepage"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDraft(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            Save sermon
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

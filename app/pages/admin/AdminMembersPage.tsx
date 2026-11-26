import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  InputAdornment,
  MenuItem,
  Pagination,
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
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { AdminPageHeader, StatCard } from '../../components/admin/AdminUi.tsx';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { Subscriber } from '../../types.ts';

interface ListResponse {
  subscribers: Subscriber[];
  total: number;
  optedIn: number;
  page: number;
  pageSize: number;
  tags: Array<{ name: string; count: number }>;
}

const EMPTY = { id: '', name: '', phone: '', email: '', tags: '', whatsappOptIn: true };

export function AdminMembersPage() {
  const { authFetch } = useAdminAuth();
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (q.trim()) params.set('q', q.trim());
    if (tag) params.set('tag', tag);
    const res = await authFetch(`/api/admin/subscribers?${params}`);
    if (res.ok) setData((await res.json()) as ListResponse);
  }, [authFetch, page, q, tag]);

  useEffect(() => {
    const t = window.setTimeout(load, 250);
    return () => window.clearTimeout(t);
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setError(null);
    const res = await authFetch(editing.id ? `/api/admin/subscribers/${editing.id}` : '/api/admin/subscribers', {
      method: editing.id ? 'PUT' : 'POST',
      body: JSON.stringify({ ...editing, tags: editing.tags }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'Unable to save.');
      return;
    }
    setEditing(null);
    setNotice(editing.id ? 'Member updated.' : 'Member added.');
    void load();
  };

  const remove = async (s: Subscriber) => {
    if (!window.confirm(`Remove ${s.name || s.phone}? They will no longer receive broadcasts.`)) return;
    await authFetch(`/api/admin/subscribers/${s.id}`, { method: 'DELETE' });
    void load();
  };

  return (
    <Box>
      <AdminPageHeader
        title="Members"
        description="Your contact list for WhatsApp broadcasts. Members can join from the website, be added here, or be imported from a spreadsheet. Anyone who replies STOP is opted out automatically."
        actions={
          <>
            <Button variant="outlined" startIcon={<UploadFileOutlinedIcon />} onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setEditing({ ...EMPTY })}>
              Add member
            </Button>
          </>
        }
      />

      {notice && (
        <Alert severity="success" onClose={() => setNotice(null)} sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="Contacts" value={data?.total ?? '—'} hint={tag ? `Tagged “${tag}”` : 'All members'} />
        <StatCard label="Opted in to WhatsApp" value={data?.optedIn ?? '—'} />
        <StatCard label="Groups (tags)" value={data?.tags.length ?? '—'} />
        <StatCard label="Opted out" value={data ? data.total - data.optedIn : '—'} />
      </Box>

      <Card>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2, alignItems: { md: 'center' } }}>
          <TextField
            size="small"
            placeholder="Search name, phone or email"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 280 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip label="All" color={tag === '' ? 'primary' : 'default'} onClick={() => setTag('')} />
            {data?.tags.map((t) => (
              <Chip
                key={t.name}
                label={`${t.name} (${t.count})`}
                color={tag === t.name ? 'primary' : 'default'}
                onClick={() => {
                  setTag(t.name);
                  setPage(1);
                }}
              />
            ))}
          </Stack>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>WhatsApp</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                <TableCell>Groups</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.subscribers.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{s.name || '—'}</TableCell>
                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>+{s.phone}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{s.email || '—'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {s.tags.map((t) => (
                        <Chip key={t} label={t} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={s.whatsappOptIn ? 'Subscribed' : 'Opted out'} color={s.whatsappOptIn ? 'success' : 'default'} variant={s.whatsappOptIn ? 'filled' : 'outlined'} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setEditing({ id: s.id, name: s.name, phone: `+${s.phone}`, email: s.email, tags: s.tags.join(', '), whatsappOptIn: s.whatsappOptIn })
                        }
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => remove(s)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.subscribers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    No members yet. Add one, import a CSV, or share the WhatsApp sign-up on the website.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && data.total > data.pageSize && (
          <Stack sx={{ p: 2, alignItems: 'center' }}>
            <Pagination count={Math.ceil(data.total / data.pageSize)} page={page} onChange={(_e, p) => setPage(p)} />
          </Stack>
        )}
      </Card>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing?.id ? 'Edit member' : 'Add member'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {editing && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Full name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <TextField
                label="WhatsApp number"
                required
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                helperText="Include the country code, e.g. +234 803 123 4567. Numbers starting with 0 are treated as Nigerian."
              />
              <TextField label="Email (optional)" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              <TextField
                label="Groups"
                value={editing.tags}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                helperText="Comma-separated, e.g. member, youth, choir. Used to target broadcasts."
              />
              <FormControlLabel
                control={<Switch checked={editing.whatsappOptIn} onChange={(e) => setEditing({ ...editing, whatsappOptIn: e.target.checked })} />}
                label="Has agreed to receive WhatsApp messages"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={(msg) => {
          setImportOpen(false);
          setNotice(msg);
          void load();
        }}
      />
    </Box>
  );
}

/** Minimal CSV parser (handles quoted fields and commas inside quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

function ImportDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (msg: string) => void }) {
  const { authFetch } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState({ name: -1, phone: -1, email: -1, tags: -1 });
  const [extraTags, setExtraTags] = useState('member');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const header = rows[0] || [];
  const body = rows.slice(1);

  const onFile = async (file: File) => {
    const parsed = parseCsv(await file.text());
    setRows(parsed);
    const find = (...names: string[]) => (parsed[0] || []).findIndex((h) => names.some((n) => h.toLowerCase().includes(n)));
    setMap({ name: find('name'), phone: find('phone', 'whatsapp', 'mobile', 'number'), email: find('email'), tags: find('tag', 'group') });
  };

  const submit = async () => {
    if (map.phone < 0) {
      setError('Please choose which column holds the phone number.');
      return;
    }
    setBusy(true);
    setError(null);
    const payload = body.map((r) => ({
      name: map.name >= 0 ? r[map.name] : '',
      phone: r[map.phone],
      email: map.email >= 0 ? r[map.email] : '',
      tags: map.tags >= 0 ? r[map.tags] : '',
    }));
    const res = await authFetch('/api/admin/subscribers/import', { method: 'POST', body: JSON.stringify({ rows: payload, tags: extraTags }) });
    const json = (await res.json()) as { imported?: number; invalidCount?: number; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Import failed.');
      return;
    }
    setRows([]);
    onDone(`Imported ${json.imported} member(s).${json.invalidCount ? ` ${json.invalidCount} row(s) skipped (invalid phone).` : ''}`);
  };

  const col = (key: keyof typeof map, label: string) => (
    <TextField select size="small" label={label} value={map[key]} onChange={(e) => setMap({ ...map, [key]: Number(e.target.value) })} sx={{ minWidth: 150 }}>
      <MenuItem value={-1}>(none)</MenuItem>
      {header.map((h, i) => (
        <MenuItem key={i} value={i}>
          {h || `Column ${i + 1}`}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Import members from CSV</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Export your member list from Excel or Google Sheets as CSV. The first row should be column headings. Only import people who have
          agreed to receive WhatsApp messages from the church.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <Button variant="outlined" onClick={() => fileRef.current?.click()} startIcon={<UploadFileOutlinedIcon />}>
          Choose CSV file
        </Button>
        {rows.length > 0 && (
          <>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', my: 2.5 }}>
              {col('name', 'Name column')}
              {col('phone', 'Phone column *')}
              {col('email', 'Email column')}
              {col('tags', 'Groups column')}
              <TextField size="small" label="Add groups to everyone" value={extraTags} onChange={(e) => setExtraTags(e.target.value)} />
            </Stack>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {body.length} row(s) found. Preview:
            </Typography>
            <TableContainer sx={{ maxHeight: 240, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Groups</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {body.slice(0, 8).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{map.name >= 0 ? r[map.name] : ''}</TableCell>
                      <TableCell>{map.phone >= 0 ? r[map.phone] : ''}</TableCell>
                      <TableCell>{map.email >= 0 ? r[map.email] : ''}</TableCell>
                      <TableCell>{map.tags >= 0 ? r[map.tags] : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!body.length || busy}>
          {busy ? 'Importing…' : `Import ${body.length || ''} member(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

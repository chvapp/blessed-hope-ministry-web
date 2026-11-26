import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { AdminPageHeader } from '../../components/admin/AdminUi.tsx';
import { type AdminRole, useAdminAuth } from '../../context/AdminAuthContext.tsx';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

const ROLES: Array<{ value: AdminRole; label: string; desc: string }> = [
  { value: 'editor', label: 'Editor', desc: 'Devotionals, sermons, events and the inbox' },
  { value: 'admin', label: 'Admin', desc: 'Everything except managing the team' },
  { value: 'super_admin', label: 'Super admin', desc: 'Full access, including team members' },
];
const roleLabel = (r: AdminRole) => ROLES.find((x) => x.value === r)?.label ?? r;

export function AdminTeamPage() {
  const { authFetch, user, can, replaceToken } = useAdminAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [adding, setAdding] = useState<{ name: string; email: string; role: AdminRole; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!can('super_admin')) return;
    const res = await authFetch('/api/admin/users');
    if (res.ok) setTeam(((await res.json()) as { users: TeamMember[] }).users);
  }, [authFetch, can]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!adding) return;
    setError(null);
    const res = await authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(adding) });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'Unable to add team member.');
      return;
    }
    setNotice(`${adding.name} can now sign in with ${adding.email} and the password you set. Ask them to change it after signing in.`);
    setAdding(null);
    void load();
  };

  const update = async (m: TeamMember, patch: Record<string, unknown>) => {
    const res = await authFetch(`/api/admin/users/${m.id}`, { method: 'PUT', body: JSON.stringify(patch) });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) setError(json.error || 'Update failed.');
    void load();
  };

  const remove = async (m: TeamMember) => {
    if (!window.confirm(`Remove ${m.name}'s access?`)) return;
    await authFetch(`/api/admin/users/${m.id}`, { method: 'DELETE' });
    void load();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    const res = await authFetch('/api/admin/auth/password', { method: 'POST', body: JSON.stringify(pw) });
    const json = (await res.json()) as { token?: string; error?: string };
    if (!res.ok || !json.token) {
      setPwMsg({ type: 'error', text: json.error || 'Unable to change password.' });
      return;
    }
    replaceToken(json.token);
    setPw({ currentPassword: '', newPassword: '' });
    setPwMsg({ type: 'success', text: 'Password changed. You’ve been signed out on other devices.' });
  };

  return (
    <Box>
      <AdminPageHeader
        title="Team & account"
        description="Manage who can access the admin dashboard."
        actions={
          can('super_admin') ? (
            <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setAdding({ name: '', email: '', role: 'editor', password: '' })}>
              Add team member
            </Button>
          ) : undefined
        }
      />
      {notice && (
        <Alert severity="success" onClose={() => setNotice(null)} sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {error && !adding && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: can('super_admin') ? '2fr 1fr' : '1fr' }, gap: 3, alignItems: 'start' }}>
        {can('super_admin') && (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last sign-in</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {team.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Typography component="div" sx={{ fontWeight: 600 }}>
                          {m.name} {m.id === user?.id && <Chip size="small" label="You" sx={{ ml: 0.5 }} />}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {m.id === user?.id ? (
                          roleLabel(m.role)
                        ) : (
                          <TextField select size="small" value={m.role} onChange={(e) => update(m, { role: e.target.value })} sx={{ minWidth: 140 }}>
                            {ROLES.map((r) => (
                              <MenuItem key={r.value} value={r.value}>
                                {r.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      </TableCell>
                      <TableCell>{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString() : 'Never'}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {m.id !== user?.id && (
                          <>
                            <Button size="small" onClick={() => update(m, { isActive: !m.isActive })}>
                              {m.isActive ? 'Suspend' : 'Reactivate'}
                            </Button>
                            <Button size="small" color="error" onClick={() => remove(m)}>
                              Remove
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6">Your account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user?.name} · {user?.email} · {user && roleLabel(user.role)}
            </Typography>
            {pwMsg && (
              <Alert severity={pwMsg.type} sx={{ mb: 2 }}>
                {pwMsg.text}
              </Alert>
            )}
            <Box component="form" onSubmit={changePassword}>
              <Stack spacing={2}>
                <TextField
                  label="Current password"
                  type="password"
                  required
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                  autoComplete="current-password"
                />
                <TextField
                  label="New password"
                  type="password"
                  required
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                  helperText="At least 10 characters."
                  autoComplete="new-password"
                />
                <Button type="submit" variant="outlined">
                  Change password
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={Boolean(adding)} onClose={() => setAdding(null)} fullWidth maxWidth="sm">
        <DialogTitle>Add team member</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {adding && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Full name" required value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
              <TextField label="Email" type="email" required value={adding.email} onChange={(e) => setAdding({ ...adding, email: e.target.value })} />
              <TextField select label="Role" value={adding.role} onChange={(e) => setAdding({ ...adding, role: e.target.value as AdminRole })}>
                {ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}: {r.desc}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Temporary password"
                type="text"
                required
                value={adding.password}
                onChange={(e) => setAdding({ ...adding, password: e.target.value })}
                helperText="At least 10 characters. Share it privately; they can change it after signing in."
                autoComplete="off"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAdding(null)}>Cancel</Button>
          <Button variant="contained" onClick={add}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import React, { useState } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { type AdminRole, useAdminAuth } from '../context/AdminAuthContext.tsx';
import { brand } from '../theme/muiTheme.ts';
import { Logo } from './site/Logo.tsx';

const DRAWER_WIDTH = 264;

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  minRole: AdminRole;
}

const NAV: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: 'Content',
    items: [
      { label: 'Overview', to: '/admin', icon: <DashboardOutlinedIcon fontSize="small" />, minRole: 'editor' },
      { label: 'Devotionals', to: '/admin/devotionals', icon: <MenuBookOutlinedIcon fontSize="small" />, minRole: 'editor' },
      { label: 'Sermons & live', to: '/admin/media', icon: <VideoLibraryOutlinedIcon fontSize="small" />, minRole: 'editor' },
      { label: 'Events', to: '/admin/events', icon: <EventOutlinedIcon fontSize="small" />, minRole: 'editor' },
      { label: 'Inbox', to: '/admin/community', icon: <InboxOutlinedIcon fontSize="small" />, minRole: 'editor' },
    ],
  },
  {
    heading: 'People & giving',
    items: [
      { label: 'Members', to: '/admin/members', icon: <ContactsOutlinedIcon fontSize="small" />, minRole: 'admin' },
      { label: 'WhatsApp broadcasts', to: '/admin/broadcasts', icon: <WhatsAppIcon fontSize="small" />, minRole: 'admin' },
      { label: 'Giving', to: '/admin/giving', icon: <PaymentsOutlinedIcon fontSize="small" />, minRole: 'admin' },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Site settings', to: '/admin/settings', icon: <SettingsOutlinedIcon fontSize="small" />, minRole: 'admin' },
      { label: 'Team & account', to: '/admin/team', icon: <GroupOutlinedIcon fontSize="small" />, minRole: 'editor' },
    ],
  },
];

const ROLE_LABEL: Record<AdminRole, string> = { super_admin: 'Super admin', admin: 'Admin', editor: 'Editor' };

export function AdminLayout() {
  const { user, loadingStatus, logout, can } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loadingStatus) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <AdminSignIn />;

  const allItems = NAV.flatMap((g) => g.items);
  const current = allItems.find((i) => i.to === location.pathname) || allItems[0];
  const allowed = can(current.minRole);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: brand.navyDeep, color: brand.white }}>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Logo inverted size={38} />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5 }}>
        {NAV.map((group) => {
          const items = group.items.filter((i) => can(i.minRole));
          if (!items.length) return null;
          return (
            <List
              key={group.heading}
              dense
              subheader={
                <ListSubheader
                  disableSticky
                  sx={{ bgcolor: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 2.6 }}
                >
                  {group.heading}
                </ListSubheader>
              }
            >
              {items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <ListItemButton
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    selected={active}
                    onClick={() => setMobileOpen(false)}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.25,
                      color: 'rgba(255,255,255,0.78)',
                      '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.55)', minWidth: 34 },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                      '&.Mui-selected, &.Mui-selected:hover': {
                        bgcolor: 'rgba(201,162,63,0.16)',
                        color: brand.white,
                        '& .MuiListItemIcon-root': { color: brand.gold },
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: '0.88rem', fontWeight: active ? 600 : 500 } } }} />
                  </ListItemButton>
                );
              })}
            </List>
          );
        })}
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: brand.gold, color: brand.ink, width: 34, height: 34, fontSize: '0.9rem', fontWeight: 700 }}>
          {(user.name || user.email)[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
            {ROLE_LABEL[user.role]}
          </Typography>
        </Box>
        <IconButton aria-label="Sign out" onClick={logout} size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <LogoutOutlinedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: brand.white, borderBottom: `1px solid ${brand.border}` }}>
          <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <IconButton aria-label="Open admin menu" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}>
                <MenuIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 700 }}>{current.label}</Typography>
            </Stack>
            <Button component={RouterLink} to="/" target="_blank" size="small" variant="outlined" endIcon={<OpenInNewOutlinedIcon fontSize="small" />}>
              View site
            </Button>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, width: '100%', mx: 'auto' }}>
          {allowed ? <Outlet /> : <Alert severity="warning">You don’t have permission to view this page. Ask a super admin to update your role.</Alert>}
        </Box>
      </Box>
    </Box>
  );
}

function AdminSignIn() {
  const { needsSetup, setupEnabled, login, setup } = useAdminAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (needsSetup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (needsSetup) await setup({ setupToken, name, email, password });
      else await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: brand.navyDeep, p: 2.5 }}>
      <Card sx={{ maxWidth: 440, width: '100%', border: 0, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          <Box sx={{ mb: 3 }}>
            <Logo size={44} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {needsSetup ? 'Create the first admin account' : 'Staff sign in'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            {needsSetup
              ? 'This account will be the super admin. You’ll need the setup token configured on the server (ADMIN_SETUP_TOKEN).'
              : 'Sign in to manage devotionals, events, members, broadcasts and giving.'}
          </Typography>
          {needsSetup && !setupEnabled && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Setup is locked. Set the ADMIN_SETUP_TOKEN secret on the server, then reload this page.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              {needsSetup && (
                <>
                  <TextField label="Setup token" required value={setupToken} onChange={(e) => setSetupToken(e.target.value)} autoComplete="off" />
                  <TextField label="Your name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </>
              )}
              <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              <TextField
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={needsSetup ? 'new-password' : 'current-password'}
                helperText={needsSetup ? 'At least 10 characters.' : undefined}
              />
              {needsSetup && (
                <TextField label="Confirm password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              )}
              <Button type="submit" variant="contained" size="large" disabled={busy || (needsSetup && !setupEnabled)}>
                {busy ? 'Please wait…' : needsSetup ? 'Create account' : 'Sign in'}
              </Button>
              <Button component={RouterLink} to="/" size="small" color="inherit">
                Back to website
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

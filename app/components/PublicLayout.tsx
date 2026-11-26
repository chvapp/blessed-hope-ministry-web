import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from './site/Logo.tsx';
import { JoinOnlineBand } from './site/Blocks.tsx';
import { WhatsAppChatButton, WhatsAppSignup } from './site/WhatsAppSignup.tsx';
import { MINISTRY, NAVIGATION, SERVICE_TIMES, SERVICE_TIMEZONE_NOTE, type NavGroup } from '../content/site.ts';
import { brand } from '../theme/muiTheme.ts';
import type { SiteSettings } from '../types.ts';

const SOCIALS = [
  { label: 'YouTube', href: MINISTRY.social.youtube, Icon: YouTubeIcon },
  { label: 'Facebook', href: MINISTRY.social.facebook, Icon: FacebookIcon },
  { label: 'Instagram', href: MINISTRY.social.instagram, Icon: InstagramIcon },
  { label: 'X', href: MINISTRY.social.x, Icon: XIcon },
];

function isActive(group: NavGroup, pathname: string) {
  if (group.to) return group.to === '/' ? pathname === '/' : pathname.startsWith(group.to);
  return Boolean(group.children?.some((c) => pathname === c.to.split('#')[0]));
}

export function PublicLayout({ settings }: { settings: SiteSettings | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Scroll to in-page anchors such as /about#beliefs after navigation.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [location.pathname, location.hash]);

  const solid = scrolled || mobileOpen;
  const fg = solid ? brand.navy : brand.white;
  const live = Boolean(settings?.liveActive);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: brand.white }}>
      <Box
        component="a"
        href="#main"
        sx={{
          position: 'absolute',
          left: -9999,
          '&:focus': { left: 16, top: 16, zIndex: 2000, bgcolor: brand.white, p: 1.5, borderRadius: 1 },
        }}
      >
        Skip to content
      </Box>

      {/* Header: transparent over the hero, solid white once the page scrolls */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          transition: 'background-color 250ms ease, box-shadow 250ms ease',
          bgcolor: solid ? 'rgba(255,255,255,0.97)' : 'transparent',
          boxShadow: solid ? '0 1px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)' : 'none',
          backdropFilter: solid ? 'blur(10px)' : 'none',
        }}
      >
        {/* Utility bar */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            borderBottom: `1px solid ${solid ? brand.border : 'rgba(255,255,255,0.14)'}`,
            maxHeight: solid ? 0 : 44,
            overflow: 'hidden',
            transition: 'max-height 250ms ease',
          }}
        >
          <Container maxWidth="lg">
            <Stack direction="row" sx={{ height: 40, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)', letterSpacing: '0.04em' }}>
                Sundays {SERVICE_TIMES[0].times.join(' · ')} · Wednesdays {SERVICE_TIMES[1].times[0]} (WAT)
              </Typography>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                {SOCIALS.map(({ label, href, Icon }) => (
                  <Box
                    key={label}
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    sx={{ color: 'rgba(255,255,255,0.78)', display: 'flex', '&:hover': { color: brand.gold } }}
                  >
                    <Icon sx={{ fontSize: 17 }} />
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Container>
        </Box>

        <Container maxWidth="lg">
          <Stack
            direction="row"
            sx={{ height: { xs: 70, md: 84 }, alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
          >
            <Box component={RouterLink} to="/" aria-label="Blessed Hope Ministry home" sx={{ textDecoration: 'none' }}>
              <Logo inverted={!solid} size={46} />
            </Box>

            {/* Desktop navigation with hover / focus dropdowns */}
            <Stack component="nav" aria-label="Main" direction="row" sx={{ display: { xs: 'none', lg: 'flex' } }}>
              {NAVIGATION.map((group) => (
                <DesktopNavItem key={group.label} group={group} color={fg} pathname={location.pathname} />
              ))}
            </Stack>

            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Button
                component={RouterLink}
                to="/media"
                size="small"
                variant="outlined"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  color: fg,
                  borderColor: solid ? brand.border : 'rgba(255,255,255,0.45)',
                  gap: 1,
                  '&:hover': { borderColor: solid ? brand.navy : brand.white },
                }}
              >
                {live && <span className="live-dot" />}
                {live ? 'Live now' : 'Livestream'}
              </Button>
              <Button component={RouterLink} to="/give" size="small" variant="contained" color="secondary">
                Give
              </Button>
              <IconButton
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { xs: 'inline-flex', lg: 'none' }, color: fg }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Mobile navigation */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 380 }, bgcolor: brand.navyDeep, color: brand.white } } }}
      >
        <Stack direction="row" sx={{ p: 2.5, alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo inverted size={40} />
          <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)} sx={{ color: brand.white }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ px: 1.5, py: 2, flex: 1, overflowY: 'auto' }}>
          {NAVIGATION.map((group) =>
            group.children ? (
              <Accordion
                key={group.label}
                disableGutters
                sx={{ bgcolor: 'transparent', color: brand.white, boxShadow: 'none', '&::before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: brand.gold }} />}>
                  <Typography sx={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                    {group.label}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={0.5}>
                    {group.children.map((c) => (
                      <Box
                        key={c.to}
                        component={RouterLink}
                        to={c.to}
                        onClick={() => setMobileOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', py: 1, pl: 1.5, borderLeft: `2px solid ${brand.gold}` }}
                      >
                        {c.label}
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ) : (
              <Box
                key={group.label}
                component={RouterLink}
                to={group.to!}
                sx={{
                  display: 'block',
                  px: 2,
                  py: 1.75,
                  color: brand.white,
                  textDecoration: 'none',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: '0.9rem',
                }}
              >
                {group.label}
              </Box>
            )
          )}
        </Box>
        <Stack spacing={1.25} sx={{ p: 2.5 }}>
          <Button component={RouterLink} to="/give" variant="contained" color="secondary" fullWidth size="large">
            Give online
          </Button>
          <Button
            component={RouterLink}
            to="/media"
            variant="outlined"
            fullWidth
            size="large"
            sx={{ color: brand.white, borderColor: 'rgba(255,255,255,0.4)' }}
          >
            {live ? 'Watch live now' : 'Livestream'}
          </Button>
        </Stack>
      </Drawer>

      <Box component="main" id="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <JoinOnlineBand />
      <WhatsAppSignup />
      <SiteFooter settings={settings} />
      <WhatsAppChatButton number={settings?.whatsappNumber} />
    </Box>
  );
}

function DesktopNavItem({
  group,
  color,
  pathname,
}: {
  group: NavGroup;
  color: string;
  pathname: string;
}) {
  const active = isActive(group, pathname);
  const labelSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.25,
    px: 1.75,
    py: 1,
    color,
    textDecoration: 'none',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: 'none',
    border: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    position: 'relative' as const,
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 2,
      height: 2,
      bgcolor: brand.gold,
      transform: active ? 'scaleX(1)' : 'scaleX(0)',
      transition: 'transform 200ms ease',
    },
    '&:hover::after': { transform: 'scaleX(1)' },
  };

  if (!group.children) {
    return (
      <Box component={RouterLink} to={group.to!} sx={labelSx} aria-current={active ? 'page' : undefined}>
        {group.label}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        '&:hover > .dropdown, &:focus-within > .dropdown': { opacity: 1, visibility: 'visible', transform: 'translate(-50%, 0)' },
      }}
    >
      <Box component="button" type="button" sx={labelSx} aria-haspopup="true">
        {group.label}
        <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
      </Box>
      <Box
        className="dropdown"
        sx={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translate(-50%, 8px)',
          pt: 1.5,
          opacity: 0,
          visibility: 'hidden',
          transition: 'all 180ms ease',
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            width: 300,
            bgcolor: brand.white,
            borderRadius: 2,
            boxShadow: '0 18px 48px rgba(6,20,43,0.18)',
            borderTop: `3px solid ${brand.gold}`,
            p: 1,
          }}
        >
          {group.children.map((c) => (
            <Box
              key={c.to}
              component={RouterLink}
              to={c.to}
              sx={{
                display: 'block',
                px: 2,
                py: 1.25,
                borderRadius: 1.5,
                textDecoration: 'none',
                '&:hover, &:focus-visible': { bgcolor: brand.cream },
              }}
            >
              <Typography sx={{ fontWeight: 600, color: brand.navy, fontSize: '0.92rem' }}>{c.label}</Typography>
              {c.description && (
                <Typography variant="caption" sx={{ color: brand.muted }}>
                  {c.description}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  const heading = {
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    fontSize: '0.78rem',
    color: brand.gold,
    mb: 2.5,
  };
  return (
    <Box component="footer" sx={{ bgcolor: brand.ink, color: 'rgba(255,255,255,0.72)', pt: { xs: 8, md: 10 }, pb: 4 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.5fr 1fr 1fr 1.2fr' },
            gap: { xs: 5, md: 6 },
          }}
        >
          <Box>
            <Logo inverted size={50} />
            <Typography variant="body2" sx={{ mt: 2.5, lineHeight: 1.8, maxWidth: 320 }}>
              {MINISTRY.name}: {MINISTRY.mandate}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              {SOCIALS.map(({ label, href, Icon }) => (
                <IconButton
                  key={label}
                  component="a"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  size="small"
                  sx={{
                    color: brand.white,
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': { bgcolor: brand.gold, color: brand.ink, borderColor: brand.gold },
                  }}
                >
                  <Icon sx={{ fontSize: 18 }} />
                </IconButton>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography sx={heading}>Service times</Typography>
            <Stack spacing={1.75}>
              {SERVICE_TIMES.map((s) => (
                <Box key={s.day}>
                  <Typography variant="body2" sx={{ color: brand.white, fontWeight: 600 }}>
                    {s.day}: {s.name}
                  </Typography>
                  <Typography variant="body2">{s.times.join(' · ')}</Typography>
                </Box>
              ))}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {SERVICE_TIMEZONE_NOTE}
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography sx={heading}>Quick links</Typography>
            <Stack spacing={1.1}>
              {[
                ['About us', '/about'],
                ['Daily devotional', '/devotionals'],
                ['Sermons & live', '/media'],
                ['Events', '/events'],
                ['Ministries', '/ministries'],
                ['Bible Academy', '/academy'],
                ['Testimonies', '/testimonies'],
                ['Prayer request', '/prayer'],
                ['Give online', '/give'],
              ].map(([label, to]) => (
                <Box
                  key={to}
                  component={RouterLink}
                  to={to}
                  sx={{ color: 'inherit', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: brand.gold } }}
                >
                  {label}
                </Box>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography sx={heading}>Contact</Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5}>
                <PlaceOutlinedIcon sx={{ color: brand.gold, fontSize: 20, mt: 0.25 }} />
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  {settings?.sanctuaryAddress || '14 Covenant Sanctuary Way, Lagos, Nigeria'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <PhoneOutlinedIcon sx={{ color: brand.gold, fontSize: 20 }} />
                <Typography variant="body2" component="a" href={`tel:${(settings?.contactPhone || '').replace(/\s/g, '')}`} sx={{ color: 'inherit', textDecoration: 'none' }}>
                  {settings?.contactPhone || '+234 800 555 0194'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <MailOutlineIcon sx={{ color: brand.gold, fontSize: 20 }} />
                <Typography variant="body2" component="a" href={`mailto:${settings?.contactEmail || ''}`} sx={{ color: 'inherit', textDecoration: 'none', wordBreak: 'break-all' }}>
                  {settings?.contactEmail || 'care@blessedhopeministry.org'}
                </Typography>
              </Stack>
              <Button
                component={RouterLink}
                to="/plan-a-visit"
                variant="outlined"
                size="small"
                sx={{ alignSelf: 'flex-start', color: brand.white, borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: brand.gold, color: brand.gold } }}
              >
                Plan a visit
              </Button>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Typography variant="caption">
            © {new Date().getFullYear()} {MINISTRY.name}. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Box component={RouterLink} to="/contact" sx={{ color: 'inherit', fontSize: '0.75rem', textDecoration: 'none', '&:hover': { color: brand.gold } }}>
              Contact
            </Box>
            <Box component={RouterLink} to="/admin" sx={{ color: 'inherit', fontSize: '0.75rem', textDecoration: 'none', '&:hover': { color: brand.gold } }}>
              Staff login
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

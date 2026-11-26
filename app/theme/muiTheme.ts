import { createTheme } from '@mui/material/styles';

/**
 * Brand tokens shared by the public site and the admin dashboard.
 * Navy + gold carry the brand; ink is used for dark bands and the footer;
 * cream is the warm alternate section background; red is reserved for "Live".
 */
export const brand = {
  navy: '#0B1F3F',
  navyDeep: '#06142B',
  navySoft: '#E8EDF5',
  ink: '#0D0D0D',
  gold: '#C9A23F',
  goldDark: '#A8842A',
  goldSoft: '#F6EFD9',
  cream: '#F5F4F0',
  live: '#E53232',
  text: '#171717',
  muted: '#525252',
  border: '#E5E5E5',
  white: '#FFFFFF',
} as const;

export const fonts = {
  body: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  display: '"Bebas Neue", "Oswald", "Arial Narrow", sans-serif',
  serif: '"Source Serif 4", Georgia, serif',
} as const;

const displayHeading = {
  fontFamily: fonts.display,
  fontWeight: 400,
  letterSpacing: '0.02em',
  lineHeight: 1,
  textTransform: 'uppercase' as const,
};

export const publicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.navy,
      dark: brand.navyDeep,
      light: '#1E3A6B',
      contrastText: brand.white,
    },
    secondary: {
      main: brand.gold,
      dark: brand.goldDark,
      light: '#DDBE6A',
      contrastText: brand.ink,
    },
    error: { main: brand.live },
    background: {
      default: brand.white,
      paper: brand.white,
    },
    text: {
      primary: brand.text,
      secondary: brand.muted,
    },
    divider: brand.border,
  },
  typography: {
    fontFamily: fonts.body,
    h1: { ...displayHeading, fontSize: '4rem' },
    h2: { ...displayHeading, fontSize: '3rem' },
    h3: { fontFamily: fonts.body, fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: fonts.body, fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontFamily: fonts.body, fontWeight: 600 },
    h6: { fontFamily: fonts.body, fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: '0.18em', lineHeight: 1.6 },
    button: { textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderColor: brand.border } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 26,
          paddingBlock: 11,
          fontSize: '0.8rem',
        },
        sizeSmall: { paddingInline: 16, paddingBlock: 7, fontSize: '0.72rem' },
        sizeLarge: { paddingInline: 32, paddingBlock: 14, fontSize: '0.85rem' },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${brand.border}`, borderRadius: 10 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 6, backgroundColor: brand.white },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
});

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brand.navy, dark: brand.navyDeep, contrastText: brand.white },
    secondary: { main: brand.gold, contrastText: brand.ink },
    background: { default: '#F7F7F5', paper: brand.white },
    text: { primary: brand.text, secondary: brand.muted },
    divider: brand.border,
  },
  typography: {
    fontFamily: fonts.body,
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderColor: brand.border } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 6 } },
    },
  },
});

import React from 'react';
import { Box, Typography } from '@mui/material';
import { brand, fonts } from '../../theme/muiTheme.ts';

/**
 * Placeholder brand mark for Blessed Hope Gospel Ministry.
 * An anchor whose shank forms a cross ("hope… an anchor of the soul", Heb 6:19),
 * set against dawn rays ("looking for that blessed hope", Titus 2:13).
 */
export function LogoMark({
  size = 44,
  tone = 'dark',
}: {
  size?: number;
  /** 'dark' = navy badge (for light or dark backgrounds); 'light' = white outline badge */
  tone?: 'dark' | 'light';
}) {
  const badge = tone === 'dark' ? brand.navy : 'transparent';
  const ring = brand.gold;
  const mark = tone === 'dark' ? brand.white : brand.white;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Blessed Hope Gospel Ministry logo"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <circle cx="32" cy="32" r="30" fill={badge} stroke={ring} strokeWidth="2.5" />
      {/* Dawn rays */}
      <g stroke={ring} strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
        <line x1="32" y1="6.5" x2="32" y2="10" />
        <line x1="20.5" y1="9.5" x2="22.3" y2="12.6" />
        <line x1="43.5" y1="9.5" x2="41.7" y2="12.6" />
        <line x1="11.8" y1="17.5" x2="14.9" y2="19.3" />
        <line x1="52.2" y1="17.5" x2="49.1" y2="19.3" />
      </g>
      {/* Anchor-cross */}
      <g fill="none" stroke={mark} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="15.5" r="3" />
        <line x1="32" y1="18.5" x2="32" y2="51" />
        <line x1="23" y1="26" x2="41" y2="26" />
        <path d="M17 39 C18.5 47.5 24.5 51.5 32 51.5 C39.5 51.5 45.5 47.5 47 39" />
      </g>
      <g fill={ring}>
        <path d="M17 39 L13.2 42.2 L14.2 36.6 Z" />
        <path d="M47 39 L50.8 42.2 L49.8 36.6 Z" />
      </g>
    </svg>
  );
}

export function Logo({
  inverted = false,
  size = 44,
}: {
  /** true when placed on a dark background (white wordmark) */
  inverted?: boolean;
  size?: number;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <LogoMark size={size} />
      <Box sx={{ lineHeight: 1, minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontFamily: fonts.display,
            fontSize: size * 0.56,
            letterSpacing: '0.06em',
            lineHeight: 0.95,
            color: inverted ? brand.white : brand.navy,
            whiteSpace: 'nowrap',
          }}
        >
          Blessed Hope
        </Typography>
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontSize: size * 0.2,
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: brand.gold,
            mt: 0.4,
            whiteSpace: 'nowrap',
          }}
        >
          Gospel Ministry
        </Typography>
      </Box>
    </Box>
  );
}

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ChurchOutlinedIcon from '@mui/icons-material/ChurchOutlined';

interface EditorialImageProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  height?: number | string | Record<string, number | string>;
  borderRadius?: number;
}

export const GENERATED_IMAGES = {
  heroSanctuary: '/images/hero_sanctuary.jpg',
  devotionalStudy: '/images/devotional_study.jpg',
  worshipCongregation: '/images/worship_congregation.jpg',
  academyFellowship: '/images/academy_fellowship.jpg',
} as const;

export function EditorialImage({
  src,
  alt,
  aspectRatio = '16 / 9',
  height,
  borderRadius = 8,
}: EditorialImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <Box
        sx={{
          width: '100%',
          height: height ?? 'auto',
          aspectRatio: height ? undefined : aspectRatio,
          borderRadius: `${borderRadius}px`,
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1px solid #BFDBFE',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 3,
          color: '#475569',
        }}
      >
        <ChurchOutlinedIcon sx={{ fontSize: 32, color: '#1D4ED8' }} />
        <Typography variant="caption" sx={{ textAlign: 'center', maxWidth: 260 }}>
          {alt}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      sx={{
        width: '100%',
        height: height ?? 'auto',
        aspectRatio: height ? undefined : aspectRatio,
        objectFit: 'cover',
        display: 'block',
        borderRadius: `${borderRadius}px`,
      }}
    />
  );
}

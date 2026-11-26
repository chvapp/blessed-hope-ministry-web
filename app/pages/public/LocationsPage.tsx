import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { PageHero, Section } from '../../components/site/Blocks.tsx';
import { IMAGES, LOCATIONS } from '../../content/site.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';

export function LocationsPage() {
  const regions = useMemo(() => ['All', ...Array.from(new Set(LOCATIONS.map((l) => l.region)))], []);
  const [region, setRegion] = useState('All');
  const [query, setQuery] = useState('');

  const results = LOCATIONS.filter((l) => {
    if (region !== 'All' && l.region !== region) return false;
    const q = query.trim().toLowerCase();
    return !q || `${l.name} ${l.city} ${l.address}`.toLowerCase().includes(q);
  });

  return (
    <Box>
      <PageHero
        eyebrow="Church locator"
        title="Find a church near you"
        subtitle="Connect with our branches and home cells across the world, or join our Online Church from anywhere."
        image={IMAGES.sanctuary}
      />

      <Section>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 5, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search by city or branch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search locations' },
            }}
          />
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {regions.map((r) => (
              <Chip
                key={r}
                label={r}
                onClick={() => setRegion(r)}
                sx={{
                  fontWeight: 600,
                  bgcolor: region === r ? brand.navy : brand.cream,
                  color: region === r ? brand.white : brand.navy,
                  '&:hover': { bgcolor: region === r ? brand.navy : brand.goldSoft },
                }}
              />
            ))}
          </Stack>
        </Stack>

        {results.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center', bgcolor: brand.cream, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 600, color: brand.navy }}>No branch found there yet.</Typography>
            <Typography sx={{ color: brand.muted, mt: 1, mb: 3 }}>You can still worship with us every service through Online Church.</Typography>
            <Button component={RouterLink} to="/media" variant="contained">
              Join Online Church
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {results.map((l) => (
              <Box
                key={l.name}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: `1px solid ${l.isHeadquarters ? brand.gold : brand.border}`,
                  bgcolor: l.isHeadquarters ? brand.navy : brand.white,
                  color: l.isHeadquarters ? brand.white : brand.text,
                }}
              >
                <Typography variant="overline" sx={{ color: l.isHeadquarters ? brand.gold : brand.goldDark }}>
                  {l.isHeadquarters ? 'Global headquarters' : l.region}
                </Typography>
                <Typography sx={{ fontFamily: fonts.display, fontSize: '2.1rem', lineHeight: 1, color: l.isHeadquarters ? brand.white : brand.navy }}>
                  {l.city}
                </Typography>
                <Typography sx={{ fontWeight: 600, mt: 1 }}>{l.name}</Typography>
                <Stack spacing={1} sx={{ mt: 2, color: l.isHeadquarters ? 'rgba(255,255,255,0.8)' : brand.muted }}>
                  <Stack direction="row" spacing={1}>
                    <PlaceOutlinedIcon sx={{ fontSize: 19, color: brand.gold }} />
                    <Typography variant="body2">{l.address}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <AccessTimeIcon sx={{ fontSize: 19, color: brand.gold }} />
                    <Typography variant="body2">{l.serviceTimes}</Typography>
                  </Stack>
                </Stack>
                <Button
                  component="a"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                  startIcon={<DirectionsOutlinedIcon />}
                  sx={{
                    mt: 3,
                    ...(l.isHeadquarters ? { color: brand.white, borderColor: 'rgba(255,255,255,0.4)' } : {}),
                  }}
                >
                  Get directions
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Section>
    </Box>
  );
}

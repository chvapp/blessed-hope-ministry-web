import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHero, Section } from '../../components/site/Blocks.tsx';
import { IMAGES } from '../../content/site.ts';
import { brand } from '../../theme/muiTheme.ts';

const SUGGESTIONS: Array<[string, string]> = [
  ['Today’s devotional', '/devotionals'],
  ['Sermons & livestream', '/media'],
  ['Plan a visit', '/plan-a-visit'],
  ['Events', '/events'],
  ['Contact us', '/contact'],
];

export function NotFoundPage() {
  return (
    <Box>
      <PageHero
        eyebrow="404"
        title="Page not found"
        subtitle="The page you were looking for has moved or no longer exists. These might help instead."
        image={IMAGES.sanctuary}
      />
      <Section>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="/" variant="contained">
            Go to the home page
          </Button>
          {SUGGESTIONS.map(([label, to]) => (
            <Button key={to} component={RouterLink} to={to} variant="outlined">
              {label}
            </Button>
          ))}
        </Stack>
        <Typography sx={{ mt: 4, color: brand.muted }}>
          Need help? Call or message us from the <RouterLink to="/contact">contact page</RouterLink>.
        </Typography>
      </Section>
    </Box>
  );
}

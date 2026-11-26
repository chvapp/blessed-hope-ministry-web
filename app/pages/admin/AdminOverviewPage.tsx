import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { Devotional, Donation, GivingCurrency, SiteSettings, TimezoneSnapshot } from '../../types.ts';

interface OverviewResponse {
  counts: {
    publishedDevotionals: number;
    draftDevotionals: number;
    sermons: number;
    events: number;
    pendingSubmissions: number;
    verifiedDonations: number;
    scheduledDevotionals: number;
    lastScheduledDate: string | null;
    subscribers: number;
  };
  totalsByCurrency: Record<GivingCurrency, number>;
  recentDonations: Donation[];
  upcomingDevotionals: Devotional[];
  globalComparison: TimezoneSnapshot[];
  settings: SiteSettings;
}

export function AdminOverviewPage() {
  const { authFetch } = useAdminAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    authFetch('/api/admin/overview')
      .then(async (r) => {
        if (!r.ok) throw new Error('Unable to load overview.');
        return (await r.json()) as OverviewResponse;
      })
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [authFetch]);

  if (loading) {
    return (
      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} variant="rectangular" height={110} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{error || 'Unable to load dashboard overview.'}</Alert>;
  }

  const kpis = [
    { label: 'Published Devotionals', value: data.counts.publishedDevotionals, meta: `${data.counts.draftDevotionals} drafts` },
    { label: 'WhatsApp Members', value: data.counts.subscribers, meta: 'Subscribed to broadcasts' },
    { label: 'Pending Care Items', value: data.counts.pendingSubmissions, meta: 'Prayers, testimonies, forms' },
    { label: 'Verified Giving', value: data.counts.verifiedDonations, meta: `NGN ${data.totalsByCurrency.NGN.toLocaleString()} · USD ${data.totalsByCurrency.USD.toLocaleString()}` },
  ];

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', mb: 0.5 }}>
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current Monthly Theme: {data.settings.monthlyTheme} ({data.settings.monthlyScripture})
        </Typography>
      </Box>

      {data.counts.scheduledDevotionals < 7 && (
        <Alert severity={data.counts.scheduledDevotionals === 0 ? 'error' : 'warning'}>
          {data.counts.scheduledDevotionals === 0
            ? 'No devotional is scheduled for today or later. Visitors are seeing the most recent past devotional.'
            : `Only ${data.counts.scheduledDevotionals} devotional(s) scheduled ahead (through ${data.counts.lastScheduledDate}). Schedule more to keep the daily word flowing.`}
        </Alert>
      )}

      {/* KPI Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {kpis.map((k) => (
          <Card key={k.label} sx={{ border: '1px solid #E5E5E5' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {k.label}
              </Typography>
              <Typography className="font-mono-tabular" variant="h4" sx={{ mt: 0.75, mb: 0.5 }}>
                {k.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {k.meta}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Global Timezone Release Snapshot */}
      <Card sx={{ border: '1px solid #E5E5E5' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Live Devotional Date by Global Timezone
            </Typography>
            <Button component={RouterLink} to="/admin/devotionals" size="small" color="primary">
              Manage Schedule
            </Button>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {data.globalComparison.map((zone) => {
              const matched = data.upcomingDevotionals.find(
                (d) => d.publishDate === zone.localDate && d.status === 'published'
              );
              return (
                <Box
                  key={zone.timeZone}
                  sx={{ p: 2, border: '1px solid #E5E5E5', borderRadius: 1.5, bgcolor: '#F7F7F5' }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {zone.label}
                  </Typography>
                  <Typography className="font-mono-tabular" variant="caption" sx={{ color: '#0B1F3F', display: 'block' }}>
                    {zone.localDate} · {zone.offsetLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {matched ? `Live: ${matched.title}` : 'Fallback to latest unlocked'}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Recent Giving Snapshot */}
      <Card sx={{ border: '1px solid #E5E5E5' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recent Paystack Transactions
            </Typography>
            <Button component={RouterLink} to="/admin/giving" size="small" color="primary">
              Full Giving Ledger
            </Button>
          </Stack>

          {data.recentDonations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No Paystack transactions recorded yet. Donations initiated on /give will appear here.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Donor</TableCell>
                    <TableCell>Fund</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentDonations.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell className="font-mono-tabular">{d.reference}</TableCell>
                      <TableCell>{d.donorName}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{d.category}</TableCell>
                      <TableCell align="right" className="font-mono-tabular">
                        {d.currency} {(d.amountMinor / 100).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {d.status}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

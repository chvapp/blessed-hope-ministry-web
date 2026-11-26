import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { Donation } from '../../types.ts';

export function AdminGivingPage() {
  const { authFetch } = useAdminAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [paystackConfigured, setPaystackConfigured] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const loadDonations = useCallback(async () => {
    const res = await authFetch('/api/admin/donations');
    if (res.ok) {
      const json = (await res.json()) as {
        donations: Donation[];
        paystackConfigured: boolean;
      };
      setDonations(json.donations);
      setPaystackConfigured(json.paystackConfigured);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadDonations();
  }, [loadDonations]);

  const handleReverify = async (reference: string) => {
    const res = await authFetch(`/api/admin/donations/${encodeURIComponent(reference)}/verify`, {
      method: 'POST',
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setToast(json.error || 'Verification failed.');
      return;
    }
    setToast(`Verified ${reference} with Paystack.`);
    await loadDonations();
  };

  const filtered = donations.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      d.reference.toLowerCase().includes(q) ||
      d.donorName.toLowerCase().includes(q) ||
      d.donorEmail.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const exportCsv = () => {
    const header = ['Reference', 'Donor Name', 'Email', 'Category', 'Currency', 'Amount', 'Status', 'Created At'];
    const rows = filtered.map((d) => [
      d.reference,
      `"${d.donorName.replace(/"/g, '""')}"`,
      d.donorEmail,
      d.category,
      d.currency,
      (d.amountMinor / 100).toFixed(2),
      d.status,
      d.createdAt,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blessed-hope-giving-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.75rem' }}>
            Giving &amp; Paystack Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Audit tithes, offerings, and mission seeds initialized and verified through Paystack.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </Button>
      </Stack>

      {!paystackConfigured && (
        <Alert severity="warning">
          PAYSTACK_SECRET_KEY is not set in server environment secrets. Add it in Settings → Secrets to verify live or test Paystack payments.
        </Alert>
      )}

      <Card sx={{ border: '1px solid #E5E5E5' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
            <TextField
              size="small"
              placeholder="Search reference, donor, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 260 }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Stack>

          {filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              No Paystack transactions match the current filter.
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
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Verify</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell className="font-mono-tabular">{d.reference}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.donorName}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.donorEmail}</Typography>
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{d.category}</TableCell>
                      <TableCell align="right" className="font-mono-tabular">
                        {d.currency} {(d.amountMinor / 100).toLocaleString()}
                      </TableCell>
                      <TableCell
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          color:
                            d.status === 'success'
                              ? '#16A34A'
                              : d.status === 'pending'
                              ? '#D97706'
                              : '#DC2626',
                        }}
                      >
                        {d.status}
                      </TableCell>
                      <TableCell className="font-mono-tabular">
                        {d.createdAt.slice(0, 10)}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<RefreshOutlinedIcon fontSize="small" />}
                          onClick={() => handleReverify(d.reference)}
                        >
                          Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} message={toast} />
    </Stack>
  );
}

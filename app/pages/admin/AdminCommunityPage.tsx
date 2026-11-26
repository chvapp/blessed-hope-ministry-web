import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import type { CommunitySubmission, CommunitySubmissionType } from '../../types.ts';

export function AdminCommunityPage() {
  const { authFetch } = useAdminAuth();
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [tab, setTab] = useState<'all' | CommunitySubmissionType>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const res = await authFetch('/api/admin/community');
    if (res.ok) {
      const json = (await res.json()) as { submissions: CommunitySubmission[] };
      setSubmissions(json.submissions);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleApprove = async (sub: CommunitySubmission) => {
    const res = await authFetch(`/api/admin/community/${sub.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isApproved: !sub.isApproved,
        status: 'reviewed',
      }),
    });
    if (res.ok) {
      setToast(sub.isApproved ? 'Hidden from public testimonies.' : 'Approved for public site.');
      await loadData();
    }
  };

  const handleMarkReviewed = async (sub: CommunitySubmission) => {
    const res = await authFetch(`/api/admin/community/${sub.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'reviewed' }),
    });
    if (res.ok) {
      setToast('Marked as reviewed.');
      await loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await authFetch(`/api/admin/community/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setToast('Submission removed.');
      await loadData();
    }
  };

  const filtered = submissions.filter((s) => tab === 'all' || s.type === tab);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: '1.75rem' }}>
          Inbox
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Prayer requests, testimonies (approve to publish), first-time visitors, new believers, academy enquiries and contact messages.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Card sx={{ border: '1px solid #E5E5E5' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Tabs
            value={tab}
            onChange={(_e, val) => setTab(val as 'all' | CommunitySubmissionType)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, borderBottom: '1px solid #E5E5E5' }}
          >
            <Tab label="All Submissions" value="all" />
            <Tab label="Prayer Requests" value="prayer" />
            <Tab label="Testimonies" value="testimony" />
            <Tab label="First-Timers" value="first_timer" />
            <Tab label="New Believers" value="salvation" />
            <Tab label="Academy" value="academy" />
            <Tab label="Contact" value="contact" />
          </Tabs>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Sender</TableCell>
                  <TableCell>Subject &amp; Message</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{s.type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.subject}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.message}</Typography>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {s.type === 'testimony'
                        ? s.isApproved
                          ? 'Approved (Public)'
                          : 'Awaiting Approval'
                        : s.status}
                    </TableCell>
                    <TableCell align="right">
                      {s.type === 'testimony' ? (
                        <Button size="small" onClick={() => handleToggleApprove(s)}>
                          {s.isApproved ? 'Unpublish' : 'Approve'}
                        </Button>
                      ) : (
                        s.status === 'new' && (
                          <IconButton aria-label="Mark reviewed" size="small" onClick={() => handleMarkReviewed(s)}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        )
                      )}
                      <IconButton aria-label="Delete submission" size="small" onClick={() => handleDelete(s.id)}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} message={toast} />
    </Stack>
  );
}

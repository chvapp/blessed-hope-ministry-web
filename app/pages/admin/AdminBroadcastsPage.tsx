import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AdminPageHeader } from '../../components/admin/AdminUi.tsx';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import { brand } from '../../theme/muiTheme.ts';
import type { Broadcast, WhatsAppTemplate } from '../../types.ts';

interface Status {
  configured: boolean;
  templatesAvailable: boolean;
  webhookConfigured: boolean;
}

const STATUS_COLOR: Record<Broadcast['status'], 'default' | 'info' | 'success' | 'warning'> = {
  queued: 'info',
  sending: 'warning',
  completed: 'success',
  cancelled: 'default',
};

export function AdminBroadcastsPage() {
  const { authFetch } = useAdminAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [tags, setTags] = useState<Array<{ name: string; count: number }>>([]);

  const [templateKey, setTemplateKey] = useState('');
  const [params, setParams] = useState<string[]>([]);
  const [audienceTag, setAudienceTag] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ broadcast: Broadcast; statusCounts: Record<string, number>; failures: Array<{ name: string; phone: string; error: string }> } | null>(null);

  const loadBroadcasts = useCallback(async () => {
    const res = await authFetch('/api/admin/broadcasts');
    if (res.ok) setBroadcasts(((await res.json()) as { broadcasts: Broadcast[] }).broadcasts);
  }, [authFetch]);

  useEffect(() => {
    (async () => {
      const s = await authFetch('/api/admin/whatsapp/status');
      if (s.ok) {
        const st = (await s.json()) as Status;
        setStatus(st);
        if (st.configured && st.templatesAvailable) {
          const t = await authFetch('/api/admin/whatsapp/templates');
          const json = (await t.json()) as { templates?: WhatsAppTemplate[]; error?: string };
          if (t.ok) setTemplates(json.templates || []);
          else setTemplateError(json.error || 'Unable to load templates.');
        }
      }
      const m = await authFetch('/api/admin/subscribers?page=1');
      if (m.ok) setTags(((await m.json()) as { tags: Array<{ name: string; count: number }> }).tags);
    })();
    void loadBroadcasts();
  }, [authFetch, loadBroadcasts]);

  // Live progress while anything is sending.
  useEffect(() => {
    if (!broadcasts.some((b) => b.status === 'queued' || b.status === 'sending')) return;
    const id = window.setInterval(loadBroadcasts, 5000);
    return () => window.clearInterval(id);
  }, [broadcasts, loadBroadcasts]);

  useEffect(() => {
    authFetch('/api/admin/broadcasts/preview-audience', { method: 'POST', body: JSON.stringify({ audienceTag }) })
      .then((r) => r.json())
      .then((d: { recipients?: number }) => setAudienceCount(d.recipients ?? null))
      .catch(() => setAudienceCount(null));
  }, [audienceTag, authFetch]);

  const template = useMemo(() => templates.find((t) => `${t.name}|${t.language}` === templateKey), [templates, templateKey]);

  useEffect(() => {
    setParams(Array.from({ length: template?.bodyParamCount ?? 0 }, (_, i) => (i === 0 ? '{{name}}' : '')));
  }, [template]);

  const preview = useMemo(() => {
    if (!template) return '';
    return template.bodyText.replace(/\{\{\s*(\d+)\s*\}\}/g, (_m, n: string) => {
      const v = params[Number(n) - 1] || `{{${n}}}`;
      return v.replace(/\{\{\s*name\s*\}\}/gi, 'Ada');
    });
  }, [template, params]);

  const send = async () => {
    if (!template) return;
    if (!window.confirm(`Send “${template.name}” to ${audienceCount ?? 'all'} member(s)? This cannot be undone.`)) return;
    setSending(true);
    setError(null);
    const res = await authFetch('/api/admin/broadcasts', {
      method: 'POST',
      body: JSON.stringify({ templateName: template.name, templateLang: template.language, bodyParams: params, audienceTag, previewText: preview }),
    });
    const json = (await res.json()) as { error?: string; broadcast?: Broadcast };
    setSending(false);
    if (!res.ok) {
      setError(json.error || 'Unable to send.');
      return;
    }
    setNotice(`Broadcast queued for ${json.broadcast?.total} member(s). Messages are sent in batches; progress updates below.`);
    setTemplateKey('');
    void loadBroadcasts();
  };

  const openDetail = async (b: Broadcast) => {
    const res = await authFetch(`/api/admin/broadcasts/${b.id}`);
    if (res.ok) setDetail(await res.json());
  };

  const cancel = async (b: Broadcast) => {
    if (!window.confirm('Stop sending this broadcast? Messages already sent cannot be recalled.')) return;
    await authFetch(`/api/admin/broadcasts/${b.id}/cancel`, { method: 'POST' });
    void loadBroadcasts();
  };

  return (
    <Box>
      <AdminPageHeader
        title="WhatsApp broadcasts"
        description="Send announcements, the daily devotional or event reminders to members on WhatsApp. WhatsApp requires bulk messages to use templates approved by Meta."
      />

      {status && !status.configured && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>WhatsApp isn’t connected yet.</strong> In Meta’s WhatsApp Business platform, create an app and a phone number, then add
          WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_BUSINESS_ACCOUNT_ID as Cloudflare secrets. Add
          WHATSAPP_APP_SECRET and WHATSAPP_VERIFY_TOKEN, and point the webhook to <code>/api/whatsapp/webhook</code>. This tracks
          delivery and processes STOP replies.
        </Alert>
      )}
      {status?.configured && !status.webhookConfigured && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          The delivery webhook isn’t configured, so delivery/read receipts and STOP opt-outs won’t be recorded.
        </Alert>
      )}
      {notice && (
        <Alert severity="success" onClose={() => setNotice(null)} sx={{ mb: 3 }}>
          {notice}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 3, alignItems: 'start', mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              New broadcast
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {templateError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {templateError}
              </Alert>
            )}
            <Stack spacing={2.25}>
              <TextField
                select
                label="Message template"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                disabled={!templates.length}
                helperText={!templates.length ? 'Approved templates from your WhatsApp Business account will appear here.' : undefined}
              >
                {templates.map((t) => (
                  <MenuItem key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`}>
                    {t.name} · {t.language} · {t.category.toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>
              {params.map((p, i) => (
                <TextField
                  key={i}
                  label={`Variable {{${i + 1}}}`}
                  value={p}
                  onChange={(e) => setParams(params.map((x, j) => (j === i ? e.target.value : x)))}
                  helperText={i === 0 ? 'Tip: {{name}} is replaced with each member’s first name.' : undefined}
                  multiline={p.length > 60}
                />
              ))}
              <TextField select label="Send to" value={audienceTag || '__all__'} onChange={(e) => setAudienceTag(e.target.value === '__all__' ? '' : e.target.value)}>
                <MenuItem value="__all__">All subscribed members</MenuItem>
                {tags.map((t) => (
                  <MenuItem key={t.name} value={t.name}>
                    Group: {t.name}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {audienceCount === null ? '' : `${audienceCount} subscribed member(s) will receive this.`}
                </Typography>
                <Button variant="contained" startIcon={<SendOutlinedIcon />} disabled={!template || sending || !status?.configured || !audienceCount} onClick={send}>
                  {sending ? 'Queuing…' : 'Send broadcast'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#E7F8EE', borderColor: '#BFE8CF' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Preview
            </Typography>
            <Box sx={{ mt: 1, p: 2, bgcolor: brand.white, borderRadius: 2, boxShadow: '0 1px 1px rgba(0,0,0,0.08)', whiteSpace: 'pre-wrap', minHeight: 90 }}>
              {preview || <Typography color="text.secondary">Choose a template to preview the message.</Typography>}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, lineHeight: 1.6 }}>
              Meta charges per message for marketing and utility templates, and limits how many people a new number can message each day.
              Messages go out in batches every minute.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h6">History</Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={loadBroadcasts}>
          Refresh
        </Button>
      </Stack>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sent</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Audience</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {broadcasts.map((b) => {
                const done = b.sent + b.failed;
                return (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(b.createdAt).toLocaleString()}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        by {b.createdBy}
                      </Typography>
                    </TableCell>
                    <TableCell>{b.templateName}</TableCell>
                    <TableCell>{b.audienceTag || 'All'}</TableCell>
                    <TableCell>
                      <LinearProgress variant="determinate" value={b.total ? (done / b.total) * 100 : 0} sx={{ height: 6, borderRadius: 3, mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">
                        {b.sent} sent · {b.failed} failed · {b.total} total
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={b.status === 'completed' && b.sent === 0 && b.failed > 0 ? 'failed' : b.status}
                        color={b.status === 'completed' && b.sent === 0 && b.failed > 0 ? 'error' : STATUS_COLOR[b.status]}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button size="small" onClick={() => openDetail(b)}>
                        Details
                      </Button>
                      {(b.status === 'queued' || b.status === 'sending') && (
                        <Button size="small" color="error" onClick={() => cancel(b)}>
                          Stop
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!broadcasts.length && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    No broadcasts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>Broadcast details</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: '#E7F8EE', borderRadius: 2, whiteSpace: 'pre-wrap' }}>{detail.broadcast.previewText || detail.broadcast.templateName}</Box>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {Object.entries(detail.statusCounts).map(([k, v]) => (
                  <Chip key={k} label={`${k}: ${v}`} />
                ))}
              </Stack>
              {detail.failures.length > 0 && (
                <>
                  <Typography variant="subtitle2">Failed recipients</Typography>
                  {detail.failures.map((f) => (
                    <Typography key={f.phone} variant="body2">
                      <strong>{f.name || `+${f.phone}`}</strong>: {f.error}
                    </Typography>
                  ))}
                </>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

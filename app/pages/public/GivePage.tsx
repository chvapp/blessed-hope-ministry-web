import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import { useSearchParams } from 'react-router-dom';
import { PageHero, ScriptureBand, Section } from '../../components/site/Blocks.tsx';
import { IMAGES } from '../../content/site.ts';
import { formatMoney } from '../../lib/format.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';
import type { Donation, GivingCategory, GivingCurrency, SiteSettings } from '../../types.ts';

const FUNDS: Array<{ value: GivingCategory; label: string; desc: string }> = [
  { value: 'tithe', label: 'Tithe', desc: 'Honouring God with the first tenth.' },
  { value: 'offering', label: 'Offering', desc: 'Thanksgiving and worship offering.' },
  { value: 'partnership', label: 'Partnership', desc: 'Missions, media and outreach.' },
  { value: 'project', label: 'Building project', desc: 'Sanctuary and facilities.' },
];

const PRESETS: Record<GivingCurrency, number[]> = {
  NGN: [5000, 10000, 25000, 50000, 100000],
  USD: [20, 50, 100, 250, 500],
};

const SYMBOL: Record<GivingCurrency, string> = { NGN: '₦', USD: '$' };

type Receipt = Pick<Donation, 'reference' | 'donorName' | 'category' | 'currency' | 'amountMinor' | 'status' | 'gatewayResponse' | 'paidAt'>;

export function GivePage({ settings }: { settings: SiteSettings | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const callbackRef = searchParams.get('reference') || searchParams.get('trxref');

  const [available, setAvailable] = useState<boolean | null>(null);
  const [fund, setFund] = useState<GivingCategory>('tithe');
  const [currency, setCurrency] = useState<GivingCurrency>('NGN');
  const [amount, setAmount] = useState('10000');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments/config')
      .then((r) => r.json())
      .then((cfg: { configured?: boolean }) => setAvailable(Boolean(cfg.configured)))
      .catch(() => setAvailable(false));
  }, []);

  const verify = useCallback(async (ref: string) => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch(`/api/payments/verify/${encodeURIComponent(ref)}`);
      const json = (await res.json()) as { donation?: Receipt; error?: string };
      if (!res.ok || !json.donation) throw new Error(json.error || 'We could not find that payment.');
      setReceipt(json.donation);
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  }, []);

  useEffect(() => {
    if (callbackRef) void verify(callbackRef);
  }, [callbackRef, verify]);

  const numericAmount = Number(amount);
  const amountValid = Number.isFinite(numericAmount) && numericAmount >= (currency === 'NGN' ? 100 : 1);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountValid) {
      setError(`Please enter at least ${currency === 'NGN' ? '₦100' : '$1'}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorName, donorEmail, category: fund, currency, amount: numericAmount }),
      });
      const json = (await res.json()) as { authorizationUrl?: string; error?: string };
      if (!res.ok || !json.authorizationUrl) throw new Error(json.error || 'Unable to start checkout.');
      window.location.assign(json.authorizationUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout.');
      setSubmitting(false);
    }
  };

  const giveAgain = () => {
    setReceipt(null);
    setVerifyError(null);
    setSearchParams({});
  };

  return (
    <Box>
      <PageHero
        eyebrow="Give online"
        title="Partner with what God is doing"
        subtitle="Your giving supports worship, outreach, missions and care for families in our communities. Thank you for your generosity."
        image={IMAGES.worship}
      />

      <Section>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: { xs: 5, md: 7 }, alignItems: 'start' }}>
          {/* Checkout card or receipt */}
          <Box sx={{ border: `1px solid ${brand.border}`, borderRadius: 3, p: { xs: 3, md: 5 }, boxShadow: '0 24px 60px rgba(6,20,43,0.06)' }}>
            {callbackRef && (verifying || receipt || verifyError) ? (
              <ReceiptView receipt={receipt} verifying={verifying} error={verifyError} onRetry={() => verify(callbackRef)} onGiveAgain={giveAgain} />
            ) : (
              <Box component="form" onSubmit={submit}>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.65rem', md: '2.05rem' }, color: brand.navy }}>
                  Give securely
                </Typography>
                <Typography sx={{ color: brand.muted, mt: 0.5, mb: 3.5 }}>Card, bank transfer and USSD via Paystack.</Typography>

                {available === false && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Online giving is being set up. Please check back soon or give at any of our services.
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Choose a fund</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.25, mb: 3.5 }}>
                  {FUNDS.map((f) => {
                    const on = fund === f.value;
                    return (
                      <Box
                        key={f.value}
                        component="button"
                        type="button"
                        onClick={() => setFund(f.value)}
                        aria-pressed={on}
                        sx={{
                          textAlign: 'left',
                          p: 1.75,
                          borderRadius: 2,
                          cursor: 'pointer',
                          font: 'inherit',
                          border: `1.5px solid ${on ? brand.navy : brand.border}`,
                          bgcolor: on ? brand.navy : brand.white,
                          color: on ? brand.white : brand.text,
                          transition: 'all 150ms ease',
                          '&:hover': { borderColor: brand.navy },
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{f.label}</Typography>
                        <Typography variant="caption" sx={{ color: on ? 'rgba(255,255,255,0.7)' : brand.muted, lineHeight: 1.4, display: 'block', mt: 0.5 }}>
                          {f.desc}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 600 }}>Amount</Typography>
                  <ToggleButtonGroup
                    value={currency}
                    exclusive
                    size="small"
                    onChange={(_e, next: GivingCurrency | null) => {
                      if (!next) return;
                      setCurrency(next);
                      setAmount(String(PRESETS[next][1]));
                    }}
                  >
                    <ToggleButton value="NGN" sx={{ px: 2 }}>
                      NGN
                    </ToggleButton>
                    <ToggleButton value="USD" sx={{ px: 2 }}>
                      USD
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
                  {PRESETS[currency].map((p) => {
                    const on = numericAmount === p;
                    return (
                      <Button
                        key={p}
                        size="small"
                        variant={on ? 'contained' : 'outlined'}
                        color={on ? 'secondary' : 'primary'}
                        onClick={() => setAmount(String(p))}
                        sx={{ letterSpacing: 0, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {SYMBOL[currency]}
                        {p.toLocaleString()}
                      </Button>
                    );
                  })}
                </Stack>
                <TextField
                  label="Other amount"
                  type="number"
                  required
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  slotProps={{
                    input: { startAdornment: <InputAdornment position="start">{SYMBOL[currency]}</InputAdornment> },
                    htmlInput: { min: 1, step: 'any', inputMode: 'decimal' },
                  }}
                  sx={{ mb: 3.5 }}
                />

                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Your details</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3.5 }}>
                  <TextField label="Full name" required fullWidth value={donorName} onChange={(e) => setDonorName(e.target.value)} autoComplete="name" />
                  <TextField
                    label="Email for receipt"
                    type="email"
                    required
                    fullWidth
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  disabled={submitting || available === false}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}
                  sx={{ py: 1.75 }}
                >
                  {submitting ? 'Opening secure checkout…' : `Give ${amountValid ? formatMoney(Math.round(numericAmount * 100), currency) : ''}`}
                </Button>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: brand.muted, mt: 1.5 }}>
                  You’ll be redirected to Paystack to complete your gift. We never see or store your card details.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Other ways to give */}
          <Stack spacing={3}>
            {settings?.bankAccountNumber && (
            <Box sx={{ bgcolor: brand.navy, color: brand.white, borderRadius: 3, p: 4 }}>
              <Typography sx={{ fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.65rem', lineHeight: 1 }}>Bank transfer</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, mb: 2.5 }}>Prefer to give directly? Use our church account.</Typography>
              {[
                ['Bank', settings.bankName],
                ['Account name', settings.bankAccountName],
                ['Account number', settings.bankAccountNumber],
              ].map(([k, v]) => (
                <Stack key={k} direction="row" sx={{ justifyContent: 'space-between', py: 1.25, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    {k}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {v}
                  </Typography>
                </Stack>
              ))}
            </Box>
            )}
            <Box sx={{ bgcolor: brand.cream, borderRadius: 3, p: 4 }}>
              <Typography sx={{ fontWeight: 700, color: brand.navy }}>Need a receipt or have a question?</Typography>
              <Typography variant="body2" sx={{ color: brand.muted, mt: 1, lineHeight: 1.75 }}>
                A Paystack receipt is emailed to you after every gift. For giving statements, contact the church office and quote
                your reference (it starts with BHM-).
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Section>

      <ScriptureBand
        text="Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver."
        reference="2 Corinthians 9:7"
      />
    </Box>
  );
}

function ReceiptView({
  receipt,
  verifying,
  error,
  onRetry,
  onGiveAgain,
}: {
  receipt: Receipt | null;
  verifying: boolean;
  error: string | null;
  onRetry: () => void;
  onGiveAgain: () => void;
}) {
  if (verifying) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', py: 6, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ fontWeight: 600 }}>Confirming your gift with Paystack…</Typography>
      </Stack>
    );
  }
  if (error || !receipt) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', py: 4, textAlign: 'center' }}>
        <ErrorOutlineRoundedIcon sx={{ fontSize: 56, color: brand.live }} />
        <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>We couldn’t confirm this payment</Typography>
        <Typography sx={{ color: brand.muted }}>{error}</Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={onRetry}>
            Try again
          </Button>
          <Button variant="outlined" onClick={onGiveAgain}>
            Back to giving
          </Button>
        </Stack>
      </Stack>
    );
  }
  const ok = receipt.status === 'success';
  const pending = receipt.status === 'pending';
  const Icon = ok ? CheckCircleRoundedIcon : pending ? HourglassEmptyRoundedIcon : ErrorOutlineRoundedIcon;
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Icon sx={{ fontSize: 64, color: ok ? '#16A34A' : pending ? brand.gold : brand.live }} />
      <Typography variant="h2" sx={{ fontSize: '1.85rem', color: brand.navy, mt: 1 }}>
        {ok ? 'Thank you!' : pending ? 'Payment pending' : 'Payment not completed'}
      </Typography>
      <Typography sx={{ color: brand.muted, mt: 1, mb: 3 }}>
        {ok
          ? `${receipt.donorName}, your gift has been received. God bless you.`
          : pending
            ? 'Paystack is still processing this payment. Refresh this page in a few minutes.'
            : 'This payment did not go through. You have not been charged.'}
      </Typography>
      <Box sx={{ textAlign: 'left', bgcolor: brand.cream, borderRadius: 2, p: 3, mb: 3 }}>
        {[
          ['Amount', formatMoney(receipt.amountMinor, receipt.currency)],
          ['Fund', receipt.category[0].toUpperCase() + receipt.category.slice(1)],
          ['Reference', receipt.reference],
          ['Date', receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : '—'],
        ].map(([k, v]) => (
          <Stack key={k} direction="row" sx={{ justifyContent: 'space-between', py: 0.75, gap: 2 }}>
            <Typography variant="body2" sx={{ color: brand.muted }}>
              {k}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>
              {v}
            </Typography>
          </Stack>
        ))}
      </Box>
      <Button variant="outlined" onClick={onGiveAgain}>
        {ok ? 'Give again' : 'Try again'}
      </Button>
    </Box>
  );
}

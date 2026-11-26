import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { devotionalMeta } from '../../../shared/seo.ts';
import { PageHero, Section } from '../../components/site/Blocks.tsx';
import { IMAGES } from '../../content/site.ts';
import { formatYmd } from '../../lib/format.ts';
import { useHeadMeta } from '../../lib/seo.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';
import type { Devotional, DevotionalTodayResponse } from '../../types.ts';

const visitorTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** "Africa/Lagos" → "West Africa Standard Time" (falls back to the IANA name). */
function timeZoneName(timeZone: string): string {
  try {
    const part = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value || timeZone.replace(/_/g, ' ');
  } catch {
    return timeZone.replace(/_/g, ' ');
  }
}

interface DatedState {
  date: string;
  devotional: Devotional | null;
  error: string | null;
}

/**
 * /devotionals shows today's reading for the visitor's timezone.
 * /devotionals/YYYY-MM-DD is a permanent link to one reading (shareable and indexable),
 * still locked until that date has begun in the visitor's timezone.
 */
export function DevotionalsPage() {
  const { date } = useParams<{ date?: string }>();
  const [data, setData] = useState<DevotionalTodayResponse | null>(null);
  const [dated, setDated] = useState<DatedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // The visitor's own timezone decides which day's devotional they see.
    fetch(`/api/devotionals/today?tz=${encodeURIComponent(visitorTimeZone())}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load the devotional right now.');
        setData((await res.json()) as DevotionalTodayResponse);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load the devotional.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    fetch(`/api/devotionals/date/${encodeURIComponent(date)}?tz=${encodeURIComponent(visitorTimeZone())}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { devotional?: Devotional; error?: string };
        if (!res.ok || !body.devotional) throw new Error(body.error || 'Unable to load this devotional right now.');
        if (!cancelled) setDated({ date, devotional: body.devotional, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setDated({ date, devotional: null, error: err instanceof Error ? err.message : 'Unable to load this devotional.' });
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const current = date && dated?.date === date ? dated : null;
  const article = date ? (current?.devotional ?? null) : (data?.todayDevotional ?? null);
  const isLoading = date ? !current : loading;
  const pageError = date ? (current?.error ?? null) : error;
  const isToday = Boolean(article && data && article.publishDate === data.visitorLocalDate);
  const showingFallback = Boolean(!date && data && !data.exactDateMatch && article);

  // A devotional's own page gets its own title and description for search and sharing.
  useHeadMeta(date && article ? { ...devotionalMeta(article), type: 'article' } : null);

  const permalink = article ? `${window.location.origin}/devotionals/${article.publishDate}` : '';
  const shareText = article ? `*${article.title}*\n${article.scriptureRef}\n\n“${article.memoryVerse}”\n\nRead the devotional: ${permalink}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText.replace(/\*/g, ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Box>
      <PageHero
        eyebrow="Daily devotional"
        title={date ? 'Daily devotional' : 'Today’s word'}
        titleAs={date ? 'p' : 'h1'}
        subtitle="A fresh devotional is released every day at midnight in your own timezone, wherever you are in the world."
        image={IMAGES.study}
      >
        {data && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.25, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography sx={{ color: brand.gold, fontWeight: 600 }}>{formatYmd(data.visitorLocalDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
              {timeZoneName(data.visitorTimeZone)}
            </Typography>
          </Box>
        )}
      </PageHero>

      <Section>
        {pageError && (
          <Alert
            severity={date ? 'info' : 'error'}
            sx={{ mb: 4 }}
            action={
              date ? (
                <Button component={RouterLink} to="/devotionals" color="inherit" size="small">
                  Today’s devotional
                </Button>
              ) : undefined
            }
          >
            {pageError}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: { xs: 6, lg: 8 }, alignItems: 'start' }}>
          {/* Reading column */}
          <Box component="article" sx={{ maxWidth: 720 }}>
            {isLoading ? (
              <Stack spacing={2}>
                <Skeleton variant="text" width="35%" />
                <Skeleton variant="text" width="85%" height={64} />
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
              </Stack>
            ) : article ? (
              <>
                {showingFallback && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Today’s devotional hasn’t been published yet. Here is the most recent one, from {formatYmd(article.publishDate)}.
                  </Alert>
                )}
                <Typography variant="overline" sx={{ color: brand.goldDark }}>
                  {isToday ? 'Today' : formatYmd(article.publishDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
                <Typography variant="h2" component={date ? 'h1' : 'h2'} sx={{ fontSize: { xs: '2.75rem', md: '3.75rem' }, color: brand.navy, mt: 0.5 }}>
                  {article.title}
                </Typography>
                <Typography sx={{ mt: 1.5, color: brand.muted }}>
                  {article.scriptureRef} · {article.author}
                </Typography>

                <Box sx={{ my: 4, p: { xs: 3, md: 4 }, bgcolor: brand.navy, color: brand.white, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                  <Typography variant="overline" sx={{ color: brand.gold }}>
                    Memory verse · {article.scriptureRef}
                  </Typography>
                  <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: { xs: '1.25rem', md: '1.45rem' }, lineHeight: 1.6, mt: 1 }}>
                    “{article.memoryVerse}”
                  </Typography>
                </Box>

                {article.propheticFocus && (
                  <Typography sx={{ fontWeight: 600, color: brand.navy, mb: 3 }}>
                    <Box component="span" sx={{ color: brand.goldDark }}>
                      Focus:
                    </Box>{' '}
                    {article.propheticFocus}
                  </Typography>
                )}

                <Stack spacing={2.5}>
                  {article.body.split('\n\n').map((p, i) => (
                    <Typography
                      key={i}
                      className={i === 0 ? 'devotional-dropcap' : undefined}
                      sx={{ fontFamily: fonts.serif, fontSize: '1.15rem', lineHeight: 1.9, color: brand.text }}
                    >
                      {p}
                    </Typography>
                  ))}
                </Stack>

                {article.prayerPoints.length > 0 && (
                  <Box sx={{ mt: 5, p: { xs: 3, md: 4 }, bgcolor: brand.cream, borderRadius: 3, borderLeft: `4px solid ${brand.gold}` }}>
                    <Typography sx={{ fontFamily: fonts.display, fontSize: '2rem', color: brand.navy, lineHeight: 1, mb: 2 }}>Prayer points</Typography>
                    <Stack component="ol" spacing={1.5} sx={{ m: 0, pl: 2.5 }}>
                      {article.prayerPoints.map((pt, i) => (
                        <Typography component="li" key={i} sx={{ lineHeight: 1.75, color: brand.text, '&::marker': { color: brand.goldDark, fontWeight: 700 } }}>
                          {pt}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                  <Button
                    component="a"
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    startIcon={<WhatsAppIcon />}
                    sx={{ bgcolor: '#1DA851', '&:hover': { bgcolor: '#178A43' } }}
                  >
                    Share on WhatsApp
                  </Button>
                  <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copy}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </Stack>
              </>
            ) : pageError ? null : (
              <Box sx={{ py: 6 }}>
                <Typography variant="h2" sx={{ fontSize: '2.5rem', color: brand.navy }}>
                  Coming soon
                </Typography>
                <Typography sx={{ color: brand.muted, mt: 1 }}>Devotionals will appear here once they are published.</Typography>
              </Box>
            )}
          </Box>

          {/* Archive */}
          <Box component="aside" sx={{ position: { lg: 'sticky' }, top: { lg: 110 } }}>
            <Typography sx={{ fontFamily: fonts.display, fontSize: '2rem', color: brand.navy, lineHeight: 1 }}>Recent devotionals</Typography>
            <Typography variant="body2" sx={{ color: brand.muted, mt: 1, mb: 2.5 }}>
              Catch up on readings you may have missed.
            </Typography>
            <Stack spacing={1}>
              {date && (
                <Button component={RouterLink} to="/devotionals" variant="outlined" sx={{ alignSelf: 'flex-start', mb: 1 }}>
                  Today’s devotional
                </Button>
              )}
              {(data?.archive || []).slice(0, 14).map((item) => {
                const on = article?.id === item.id;
                return (
                  <Box
                    key={item.id}
                    component={RouterLink}
                    to={`/devotionals/${item.publishDate}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-current={on ? 'page' : undefined}
                    sx={{
                      display: 'block',
                      textAlign: 'left',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${on ? brand.gold : brand.border}`,
                      bgcolor: on ? brand.goldSoft : brand.white,
                      transition: 'all 150ms ease',
                      '&:hover': { borderColor: brand.gold },
                    }}
                  >
                    <Typography variant="caption" sx={{ color: brand.goldDark, fontWeight: 600 }}>
                      {formatYmd(item.publishDate, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: brand.navy, lineHeight: 1.4, mt: 0.25 }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: brand.muted }}>
                      {item.scriptureRef}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>
      </Section>
    </Box>
  );
}

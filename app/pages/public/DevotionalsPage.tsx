import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { PageHero, Section } from '../../components/site/Blocks.tsx';
import { IMAGES } from '../../content/site.ts';
import { formatYmd } from '../../lib/format.ts';
import { brand, fonts } from '../../theme/muiTheme.ts';
import type { Devotional, DevotionalTodayResponse } from '../../types.ts';

export function DevotionalsPage() {
  const [data, setData] = useState<DevotionalTodayResponse | null>(null);
  const [selected, setSelected] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // The visitor's own timezone decides which day's devotional they see.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    fetch(`/api/devotionals/today?tz=${encodeURIComponent(tz)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load the devotional right now.');
        const payload = (await res.json()) as DevotionalTodayResponse;
        setData(payload);
        setSelected(payload.todayDevotional);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load the devotional.'))
      .finally(() => setLoading(false));
  }, []);

  const article = selected ?? data?.todayDevotional ?? null;
  const isToday = Boolean(article && data && article.publishDate === data.visitorLocalDate);
  const showingFallback = Boolean(data && !data.exactDateMatch && article?.id === data.todayDevotional?.id);

  const shareText = article
    ? `*${article.title}*\n${article.scriptureRef}\n\n“${article.memoryVerse}”\n\nRead today’s devotional: ${window.location.origin}/devotionals`
    : '';

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
        title="Today’s word"
        subtitle="A fresh devotional is released every day at midnight in your own timezone, wherever you are in the world."
        image={IMAGES.study}
      >
        {data && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.25, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography sx={{ color: brand.gold, fontWeight: 600 }}>{formatYmd(data.visitorLocalDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
              {data.visitorTimeZone.replace(/_/g, ' ')}
            </Typography>
          </Box>
        )}
      </PageHero>

      <Section>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: { xs: 6, lg: 8 }, alignItems: 'start' }}>
          {/* Reading column */}
          <Box component="article" sx={{ maxWidth: 720 }}>
            {loading ? (
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
                <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '2.75rem', md: '3.75rem' }, color: brand.navy, mt: 0.5 }}>
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
            ) : (
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
              {(data?.archive || []).slice(0, 14).map((item) => {
                const on = article?.id === item.id;
                return (
                  <Box
                    key={item.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    aria-current={on}
                    sx={{
                      textAlign: 'left',
                      font: 'inherit',
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

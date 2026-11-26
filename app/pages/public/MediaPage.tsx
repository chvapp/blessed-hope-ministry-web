import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import RadioOutlinedIcon from '@mui/icons-material/RadioOutlined';
import type { Sermon, SiteSettings } from '../../types.ts';
import { PageHero } from '../../components/site/Blocks.tsx';
import { IMAGES } from '../../content/site.ts';
import { EditorialImage } from '../../components/EditorialImage.tsx';

export function MediaPage({ settings }: { settings: SiteSettings | null }) {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [seriesList, setSeriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'audio'>('all');
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [liveChannel, setLiveChannel] = useState<'english' | 'french' | 'yoruba'>('english');
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (seriesFilter !== 'all') params.set('series', seriesFilter);
    if (search.trim()) params.set('q', search.trim());

    setLoading(true);
    fetch(`/api/sermons?${params.toString()}`)
      .then((r) => r.json())
      .then((res: { sermons?: Sermon[]; seriesList?: string[] }) => {
        setSermons(res.sermons || []);
        if (res.seriesList) setSeriesList(res.seriesList);
      })
      .finally(() => setLoading(false));
  }, [typeFilter, seriesFilter, search]);

  const liveStreamUrl =
    liveChannel === 'french'
      ? settings?.liveStreamFrenchUrl
      : liveChannel === 'yoruba'
      ? settings?.liveStreamYorubaUrl
      : settings?.liveStreamEnglishUrl;

  return (
    <Box>
      <PageHero
        eyebrow="Media"
        title="Sermons & livestream"
        subtitle="Watch services live, catch up on past messages, and listen to Hope Radio."
        image={IMAGES.sanctuary}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>

        {/* Live Sanctuary Broadcast & Radio Split */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.5fr 0.9fr' },
            gap: 3,
            mb: 7,
          }}
        >
          <Card sx={{ bgcolor: '#06142B', color: '#FFFFFF', borderColor: '#0B1F3F' }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2.5 }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#C9A23F', fontWeight: 700 }}>
                    {settings?.liveActive ? 'SANCTUARY LIVE STREAM' : 'FEATURED BROADCAST'}
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.5rem', color: '#FFFFFF' }}>
                    {settings?.liveTitle || 'Blessed Hope Worship Broadcast'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {(['english', 'french', 'yoruba'] as const).map((lang) => (
                    <Button
                      key={lang}
                      size="small"
                      variant={liveChannel === lang ? 'contained' : 'outlined'}
                      color={liveChannel === lang ? 'secondary' : 'inherit'}
                      onClick={() => setLiveChannel(lang)}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.24)',
                        color: liveChannel === lang ? '#FFFFFF' : '#E7E5E4',
                        textTransform: 'capitalize',
                      }}
                    >
                      {lang}
                    </Button>
                  ))}
                </Stack>
              </Stack>

              <Box
                sx={{
                  aspectRatio: '16 / 9',
                  bgcolor: '#0C0A09',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <PlayArrowOutlinedIcon sx={{ fontSize: 48, color: '#60A5FA', mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 0.5 }}>
                  {liveChannel.toUpperCase()} Broadcast Channel Ready
                </Typography>
                <Typography variant="caption" sx={{ color: '#A8A29E', mb: 2, maxWidth: 420 }}>
                  Configured stream endpoint: {liveStreamUrl || 'Configured in Admin Media Manager'}
                </Typography>
                {liveStreamUrl && (
                  <Button
                    component="a"
                    href={liveStreamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Open Stream Player
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <RadioOutlinedIcon color="primary" />
                <Typography variant="overline" sx={{ color: '#0B1F3F', fontWeight: 700, letterSpacing: '0.1em' }}>
                  24/7 Hope Radio
                </Typography>
              </Stack>
              <Typography variant="h3" sx={{ fontSize: '1.8rem', mb: 1.5 }}>
                Continuous Word, Hymns &amp; Intercession
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
                Stay connected to teachings, worship sessions, and morning prayer broadcasts from any city or timezone.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Stream feed: {settings?.radioStreamUrl || 'Not configured'}
              </Typography>
              {settings?.radioStreamUrl && (
                <Button
                  component="a"
                  href={settings.radioStreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  color="primary"
                  fullWidth
                >
                  Listen to Hope Radio
                </Button>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Filter Bar */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { md: 'center' },
            gap: 2,
          }}
        >
          <Tabs
            value={typeFilter}
            onChange={(_e, val: 'all' | 'video' | 'audio') => setTypeFilter(val)}
            aria-label="Filter sermons by format"
          >
            <Tab label="All Sermons" value="all" />
            <Tab label="Video" value="video" />
            <Tab label="Audio" value="audio" />
          </Tabs>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 180, bgcolor: '#FFFFFF' }}>
              <InputLabel id="series-filter-label">Series</InputLabel>
              <Select
                labelId="series-filter-label"
                label="Series"
                value={seriesFilter}
                onChange={(e) => setSeriesFilter(e.target.value)}
              >
                <MenuItem value="all">All Series</MenuItem>
                {seriesList.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search title, speaker, or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 260 }, bgcolor: '#FFFFFF' }}
            />
          </Stack>
        </Box>

        {/* Sermon Grid */}
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} variant="rectangular" height={340} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        ) : sermons.length === 0 ? (
          <Card>
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                No matching sermons found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try clearing your search filter or switching media format.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setTypeFilter('all');
                  setSeriesFilter('all');
                  setSearch('');
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {sermons.map((sermon) => (
              <Card key={sermon.id} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <EditorialImage src={sermon.thumbnailUrl} alt={sermon.title} aspectRatio="16 / 9" borderRadius={0} />
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {sermon.mediaType.toUpperCase()} · {sermon.series} · {sermon.preachedDate}
                    </Typography>
                    <Typography variant="h4" sx={{ fontSize: '1.38rem', mb: 1 }}>
                      {sermon.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                      {sermon.summary}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {sermon.speaker} · {sermon.duration}
                    </Typography>
                    <Button size="small" color="primary" onClick={() => setActiveSermon(sermon)}>
                      Play
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Dialog open={Boolean(activeSermon)} onClose={() => setActiveSermon(null)} maxWidth="md" fullWidth>
          {activeSermon && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>
                    {activeSermon.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeSermon.speaker} · {activeSermon.series} · {activeSermon.preachedDate}
                  </Typography>
                </Box>
                <IconButton aria-label="Close media dialog" onClick={() => setActiveSermon(null)}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Typography className="font-prose" sx={{ mb: 2.5, lineHeight: 1.75 }}>
                  {activeSermon.summary}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Media source: {activeSermon.mediaUrl || 'No direct embed URL attached'}
                </Typography>
                {activeSermon.mediaUrl && (
                  <Button
                    component="a"
                    href={activeSermon.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    color="primary"
                  >
                    Launch Media Stream
                  </Button>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}

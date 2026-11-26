import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout.tsx';
import { HomePage } from './pages/public/HomePage.tsx';
import { SeoManager } from './lib/seo.ts';
import { adminTheme, publicTheme } from './theme/muiTheme.ts';
import type { Sermon, SiteSettings } from './types.ts';

// The home page ships in the main bundle; other pages load on demand for a faster first paint.
const AboutPage = lazy(() => import('./pages/public/AboutPage.tsx').then((m) => ({ default: m.AboutPage })));
const AcademyPage = lazy(() => import('./pages/public/AcademyPage.tsx').then((m) => ({ default: m.AcademyPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage.tsx').then((m) => ({ default: m.ContactPage })));
const DevotionalsPage = lazy(() => import('./pages/public/DevotionalsPage.tsx').then((m) => ({ default: m.DevotionalsPage })));
const GivePage = lazy(() => import('./pages/public/GivePage.tsx').then((m) => ({ default: m.GivePage })));
const MediaPage = lazy(() => import('./pages/public/MediaPage.tsx').then((m) => ({ default: m.MediaPage })));
const ResourcesPage = lazy(() => import('./pages/public/ResourcesPage.tsx').then((m) => ({ default: m.ResourcesPage })));
const MinistriesPage = lazy(() => import('./pages/public/MinistriesPage.tsx').then((m) => ({ default: m.MinistriesPage })));
const EventsPage = lazy(() => import('./pages/public/EventsPage.tsx').then((m) => ({ default: m.EventsPage })));
const TestimoniesPage = lazy(() => import('./pages/public/TestimoniesPage.tsx').then((m) => ({ default: m.TestimoniesPage })));
const PrayerPage = lazy(() => import('./pages/public/PrayerPage.tsx').then((m) => ({ default: m.PrayerPage })));
const PlanVisitPage = lazy(() => import('./pages/public/PlanVisitPage.tsx').then((m) => ({ default: m.PlanVisitPage })));
const NewBirthPage = lazy(() => import('./pages/public/NewBirthPage.tsx').then((m) => ({ default: m.NewBirthPage })));
const LocationsPage = lazy(() => import('./pages/public/LocationsPage.tsx').then((m) => ({ default: m.LocationsPage })));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage.tsx').then((m) => ({ default: m.NotFoundPage })));
const AdminApp = lazy(() => import('./AdminApp.tsx'));

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [featuredSermons, setFeaturedSermons] = useState<Sermon[]>([]);

  useEffect(() => {
    if (isAdminRoute) return;
    fetch('/api/site')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: {
        settings?: SiteSettings;
        featuredSermons?: Sermon[];
      } | null) => {
        if (data?.settings) setSettings(data.settings);
        if (data?.featuredSermons) setFeaturedSermons(data.featuredSermons);
      })
      .catch(() => {});
  }, [location.pathname, isAdminRoute]);

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <ThemeProvider theme={isAdminRoute ? adminTheme : publicTheme}>
      <CssBaseline />
      <SeoManager />
      <Routes>
        <Route element={<PublicLayout settings={settings} />}>
          <Route
            path="/"
            element={
              <HomePage
                settings={settings}
                featuredSermons={featuredSermons}
              />
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/devotionals" element={<DevotionalsPage />} />
          <Route path="/devotionals/:date" element={<DevotionalsPage />} />
          <Route path="/media" element={<MediaPage settings={settings} />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/resources" element={<ResourcesPage settings={settings} />} />
          <Route path="/give" element={<GivePage settings={settings} />} />
          <Route path="/contact" element={<ContactPage settings={settings} />} />
          <Route path="/ministries" element={<MinistriesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/testimonies" element={<TestimoniesPage />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/plan-a-visit" element={<PlanVisitPage />} />
          <Route path="/new-birth" element={<NewBirthPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <Suspense
              fallback={
                <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
                  <CircularProgress />
                </Box>
              }
            >
              <AdminApp />
            </Suspense>
          }
        />

      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout.tsx';
import { AboutPage } from './pages/public/AboutPage.tsx';
import { AcademyPage } from './pages/public/AcademyPage.tsx';
import { ContactPage } from './pages/public/ContactPage.tsx';
import { DevotionalsPage } from './pages/public/DevotionalsPage.tsx';
import { GivePage } from './pages/public/GivePage.tsx';
import { HomePage } from './pages/public/HomePage.tsx';
import { MediaPage } from './pages/public/MediaPage.tsx';
import { ResourcesPage } from './pages/public/ResourcesPage.tsx';
import { MinistriesPage } from './pages/public/MinistriesPage.tsx';
import { EventsPage } from './pages/public/EventsPage.tsx';
import { TestimoniesPage } from './pages/public/TestimoniesPage.tsx';
import { PrayerPage } from './pages/public/PrayerPage.tsx';
import { PlanVisitPage } from './pages/public/PlanVisitPage.tsx';
import { NewBirthPage } from './pages/public/NewBirthPage.tsx';
import { LocationsPage } from './pages/public/LocationsPage.tsx';
import { adminTheme, publicTheme } from './theme/muiTheme.ts';
import type { Sermon, SiteSettings } from './types.ts';

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

        <Route path="*" element={<Navigate to="/" replace />} />
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

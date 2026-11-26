import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout.tsx';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import { AdminBroadcastsPage } from './pages/admin/AdminBroadcastsPage.tsx';
import { AdminCommunityPage } from './pages/admin/AdminCommunityPage.tsx';
import { AdminDevotionalsPage } from './pages/admin/AdminDevotionalsPage.tsx';
import { AdminEventsPage } from './pages/admin/AdminEventsPage.tsx';
import { AdminGivingPage } from './pages/admin/AdminGivingPage.tsx';
import { AdminMediaPage } from './pages/admin/AdminMediaPage.tsx';
import { AdminMembersPage } from './pages/admin/AdminMembersPage.tsx';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage.tsx';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.tsx';
import { AdminTeamPage } from './pages/admin/AdminTeamPage.tsx';

/** The staff dashboard, loaded on demand so public visitors never download it. */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="devotionals" element={<AdminDevotionalsPage />} />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="giving" element={<AdminGivingPage />} />
          <Route path="community" element={<AdminCommunityPage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="broadcasts" element={<AdminBroadcastsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="team" element={<AdminTeamPage />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}

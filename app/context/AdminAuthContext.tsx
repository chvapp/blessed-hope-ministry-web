import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type AdminRole = 'super_admin' | 'admin' | 'editor';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

interface AdminAuthContextValue {
  token: string | null;
  user: AdminUser | null;
  needsSetup: boolean;
  setupEnabled: boolean;
  loadingStatus: boolean;
  login: (email: string, password: string) => Promise<void>;
  setup: (input: { setupToken: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  replaceToken: (token: string) => void;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  can: (minRole: AdminRole) => boolean;
}

const RANK: Record<AdminRole, number> = { editor: 1, admin: 2, super_admin: 3 };
const STORAGE_KEY = 'bhm.admin.token';

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(STORAGE_KEY, token);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: session lasts until the tab closes */
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AdminUser | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupEnabled, setSetupEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const setToken = useCallback((t: string | null) => {
    storeToken(t);
    setTokenState(t);
    if (!t) setUser(null);
  }, []);

  // Initial status + restore session from this tab.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/auth/status');
        if (res.ok) {
          const data = (await res.json()) as { needsSetup: boolean; setupEnabled: boolean };
          if (!cancelled) {
            setNeedsSetup(data.needsSetup);
            setSetupEnabled(data.setupEnabled);
          }
        }
        const existing = readStoredToken();
        if (existing) {
          const me = await fetch('/api/admin/auth/me', { headers: { Authorization: `Bearer ${existing}` } });
          if (me.ok) {
            const data = (await me.json()) as { user: AdminUser };
            if (!cancelled) setUser(data.user);
          } else if (!cancelled) {
            setToken(null);
          }
        }
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { token?: string; user?: AdminUser; error?: string };
      if (!res.ok || !data.token || !data.user) throw new Error(data.error || 'Unable to sign in.');
      setToken(data.token);
      setUser(data.user);
    },
    [setToken]
  );

  const setup = useCallback(
    async (input: { setupToken: string; name: string; email: string; password: string }) => {
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => ({}))) as { token?: string; user?: AdminUser; error?: string };
      if (!res.ok || !data.token || !data.user) throw new Error(data.error || 'Setup failed.');
      setNeedsSetup(false);
      setToken(data.token);
      setUser(data.user);
    },
    [setToken]
  );

  const logout = useCallback(() => setToken(null), [setToken]);

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(url, { ...init, headers });
      if (res.status === 401) setToken(null);
      return res;
    },
    [token, setToken]
  );

  const can = useCallback((minRole: AdminRole) => Boolean(user && RANK[user.role] >= RANK[minRole]), [user]);

  return (
    <AdminAuthContext.Provider
      value={{
        token: user ? token : null,
        user,
        needsSetup,
        setupEnabled,
        loadingStatus,
        login,
        setup,
        logout,
        replaceToken: (t) => setToken(t),
        authFetch,
        can,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}

/** Download a protected file (e.g. CSV export) using the admin token. */
export async function downloadWithAuth(authFetch: AdminAuthContextValue['authFetch'], url: string, filename: string) {
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Download failed.');
  const blobUrl = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { TokenPayload } from '@/lib/types';
import { apiFetch, fetchSession, onUnauthorized } from '@/lib/apiClient';

type AuthState = {
  user: TokenPayload | null;
  loading: boolean;
  refresh: (source?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

let refreshSeq = 0;
let hasBootstrapped = false;

async function fetchMeOnce(source: string): Promise<TokenPayload | null> {
  const session = await fetchSession(source);
  if (!session.ok) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
      console.log('[auth][client][AuthProvider] fetchMeOnce:non-ok', {
        source,
        status: session.status,
      });
    }
    return null;
  }

  return (session.user ?? null) as TokenPayload | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (source = 'AuthProvider.refresh') => {
    const traceId = ++refreshSeq;
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
      console.log('[auth][client][AuthProvider] refresh:start', { traceId, source });
    }

    setLoading(true);
    try {
      const next = await fetchMeOnce(source);
      setUser(next);

      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
        console.log('[auth][client][AuthProvider] refresh:done', {
          traceId,
          source,
          hasUser: Boolean(next),
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.replace('/login');
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
        console.log('[auth][client][AuthProvider] onUnauthorized');
      }
      setUser(null);
      setLoading(false);

      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
        router.replace('/login');
        router.refresh();
      }
    });

    return unsubscribe;
  }, [router, pathname]);

  useEffect(() => {
    // Single session check on boot (guarded against strict-mode re-mount)
    if (hasBootstrapped) return;
    hasBootstrapped = true;

    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
      console.log('[auth][client][AuthProvider] useEffect:boot');
    }
    void refresh('AuthProvider.useEffect:boot');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

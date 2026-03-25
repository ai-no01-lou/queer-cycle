'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { TokenPayload } from '@/lib/types';
import { apiFetch } from '@/lib/apiClient';

type AuthState = {
  user: TokenPayload | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

let inflightMe: Promise<TokenPayload | null> | null = null;

async function fetchMeOnce(): Promise<TokenPayload | null> {
  if (!inflightMe) {
    inflightMe = (async () => {
      const res = await apiFetch('/api/auth/me', { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.user ?? null) as TokenPayload | null;
    })().finally(() => {
      inflightMe = null;
    });
  }
  return inflightMe;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const next = await fetchMeOnce();
    setUser(next);
    setLoading(false);
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`;
    }
  };

  useEffect(() => {
    // Single session check on boot
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

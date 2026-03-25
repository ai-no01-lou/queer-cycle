'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '../providers/AuthProvider';

const inputClass = 'w-full border rounded px-3 py-2 text-sm min-h-[44px]';
const inputStyle = {
  background: 'var(--bg-surface)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
      console.log('[auth][client][LoginPage] effect', {
        authLoading,
        hasUser: Boolean(user),
      });
    }

    if (!authLoading && user) {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
        console.log('[auth][client][LoginPage] redirecting authenticated user -> /');
      }
      router.replace('/');
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-probe-source': 'LoginPage.handleSubmit',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        // Update centralized auth state once
        await refresh('LoginPage.handleSubmit:post-login');
        router.replace('/');
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>
        {error && (
          <p className="text-sm" style={{ color: 'var(--error)' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded px-4 font-medium min-h-[44px] disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        No account?{' '}
        <Link href="/register" className="underline" style={{ color: 'var(--accent)' }}>
          Register
        </Link>
      </p>
    </div>
  );
}

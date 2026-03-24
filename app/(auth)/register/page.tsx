'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const inputClass = "w-full border rounded px-3 py-2 text-sm min-h-[44px]";
const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text)" };

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        router.push('/');
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
      <h1 className="text-2xl font-bold mb-6">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Name (optional)</label>
          <input id="name" type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input id="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            className={inputClass} style={inputStyle} />
        </div>
        {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded px-4 font-medium min-h-[44px] disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm text-center" style={{ color: "var(--text-muted)" }}>
        Already have an account?{' '}
        <Link href="/login" className="underline" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
    </div>
  );
}

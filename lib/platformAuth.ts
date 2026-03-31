import type { TokenPayload } from './types';

const PLATFORM_AUTH_URL = process.env.PLATFORM_AUTH_URL || 'http://api.localhost/auth';

export async function fetchPlatformSession(token: string): Promise<TokenPayload> {
  const res = await fetch(`${PLATFORM_AUTH_URL}/session/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    // Don't cache session lookups
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`platform session/me failed: ${res.status}`);
  }

  const data = await res.json();
  // platform returns either { user } or user directly depending on implementation
  return (data.user ?? data) as TokenPayload;
}

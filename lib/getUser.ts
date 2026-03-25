import { cookies } from 'next/headers';
import type { TokenPayload } from './types';
import { fetchPlatformSession } from './platformAuth';

export async function getUserFromRequest(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    return await fetchPlatformSession(token);
  } catch {
    return null;
  }
}

import { cookies } from 'next/headers';
import { verifyToken, TokenPayload } from './auth';

export async function getUserFromRequest(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

import { jwtVerify } from 'jose';
import type { TokenPayload } from './types';

export type { TokenPayload };

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function verifyToken(token: string): Promise<TokenPayload> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return { sub: payload.sub as string, email: payload.email as string };
}

export function getUserIdFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

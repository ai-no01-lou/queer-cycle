import { NextRequest, NextResponse } from 'next/server';
import type { TokenPayload } from './types';
import { fetchPlatformSession } from './platformAuth';

export async function requireAuth(
  req: NextRequest
): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const user = await fetchPlatformSession(token);
    return { user };
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}

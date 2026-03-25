import { NextRequest, NextResponse } from 'next/server';
import { fetchPlatformSession } from '@/lib/platformAuth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (process.env.DEBUG_AUTH === '1') {
    console.log('[auth][api] /api/auth/me token?', Boolean(token));
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await fetchPlatformSession(token);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const probeSource = req.headers.get('x-auth-probe-source') ?? 'unknown';

  if (process.env.DEBUG_AUTH === '1') {
    console.log('[auth][api] /api/auth/me', {
      hasToken: Boolean(token),
      probeSource,
    });
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await verifyToken(token);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/requireAuth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;
  const userId = auth.user.sub;

  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT period_color FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    const periodColor = result.rows[0]?.period_color ?? '#C17A5A';
    return NextResponse.json({ period_color: periodColor });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;
  const userId = auth.user.sub;

  const pool = getPool();
  try {
    const body = await req.json();
    const { period_color } = body;
    if (!period_color || typeof period_color !== 'string') {
      return NextResponse.json({ error: 'period_color is required' }, { status: 400 });
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(period_color)) {
      return NextResponse.json({ error: 'Invalid color format' }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, period_color, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE
       SET period_color = $2, updated_at = now()
       RETURNING period_color`,
      [userId, period_color]
    );
    return NextResponse.json({ period_color: result.rows[0].period_color });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

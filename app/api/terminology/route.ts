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
      'SELECT * FROM user_terminology WHERE user_id = $1 ORDER BY key',
      [userId]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;
  const userId = auth.user.sub;

  const pool = getPool();
  try {
    const body = await req.json();
    const { key, label } = body;
    if (!key || !label) {
      return NextResponse.json({ error: 'key and label are required' }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO user_terminology (user_id, key, label)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET label = EXCLUDED.label, updated_at = NOW()
       RETURNING *`,
      [userId, key, label]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT * FROM user_terminology WHERE user_id = $1 ORDER BY key',
      [DEFAULT_USER_ID]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
      [DEFAULT_USER_ID, key, label]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

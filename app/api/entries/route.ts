import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/requireAuth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;
  const userId = auth.user.sub;

  const pool = getPool();
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('module_id');
  try {
    let result;
    if (moduleId) {
      result = await pool.query(
        'SELECT * FROM entries WHERE user_id = $1 AND module_id = $2 ORDER BY created_at DESC',
        [userId, moduleId]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM entries WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
    }
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
    const { module_id, data } = body;
    if (!module_id || !data) {
      return NextResponse.json({ error: 'module_id and data are required' }, { status: 400 });
    }
    const result = await pool.query(
      'INSERT INTO entries (user_id, module_id, data) VALUES ($1, $2, $3) RETURNING *',
      [userId, module_id, JSON.stringify(data)]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

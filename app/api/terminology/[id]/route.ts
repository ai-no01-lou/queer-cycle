import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/requireAuth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;
  const userId = auth.user.sub;

  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT * FROM user_terminology WHERE id = $1 AND user_id = $2',
      [params.id, userId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;
  const userId = auth.user.sub;

  const pool = getPool();
  try {
    const body = await req.json();
    const { label } = body;
    if (!label) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 });
    }
    const result = await pool.query(
      'UPDATE user_terminology SET label = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [label, params.id, userId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;
  const userId = auth.user.sub;

  const pool = getPool();
  try {
    const result = await pool.query(
      'DELETE FROM user_terminology WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, userId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT * FROM entries WHERE id = $1 AND user_id = $2',
      [params.id, DEFAULT_USER_ID]
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
  const pool = getPool();
  try {
    const body = await req.json();
    const { data } = body;
    if (!data) {
      return NextResponse.json({ error: 'data is required' }, { status: 400 });
    }
    const result = await pool.query(
      'UPDATE entries SET data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [JSON.stringify(data), params.id, DEFAULT_USER_ID]
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
  const pool = getPool();
  try {
    const result = await pool.query(
      'DELETE FROM entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

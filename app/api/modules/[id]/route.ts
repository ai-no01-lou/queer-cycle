import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM module_registry WHERE id = $1', [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

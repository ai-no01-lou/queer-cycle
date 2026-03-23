import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM module_registry ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

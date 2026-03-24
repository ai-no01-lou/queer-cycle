import Link from 'next/link';
import { getPool } from '@/lib/db';
import { getUserFromRequest } from '@/lib/getUser';

async function getRecentEntries() {
  try {
    const user = await getUserFromRequest();
    if (!user) return [];
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [user.sub]
    );
    return result.rows;
  } catch {
    return [];
  }
}

export default async function Home() {
  const entries = await getRecentEntries();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/cycle"
          className="px-4 rounded text-sm font-medium flex items-center min-h-[44px]"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Log Cycle
        </Link>
        <Link
          href="/hrt"
          className="px-4 rounded text-sm font-medium flex items-center min-h-[44px]"
          style={{ background: "var(--accent)", color: "#fff", opacity: 0.85 }}
        >
          Log HRT
        </Link>
        <Link
          href="/settings"
          className="px-4 rounded text-sm font-medium flex items-center min-h-[44px] border"
          style={{ background: "var(--bg-surface)", color: "var(--text)", borderColor: "var(--border)" }}
        >
          Settings
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Entries</h2>
      {entries.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No entries yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e: { id: string; module_id: string; data: Record<string, unknown>; created_at: string }) => (
            <li key={e.id} className="rounded p-3 text-sm border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{new Date(e.created_at).toLocaleString()}</div>
              <pre className="text-xs whitespace-pre-wrap" style={{ color: "var(--text)" }}>{JSON.stringify(e.data, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

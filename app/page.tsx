import Link from 'next/link';

async function getRecentEntries() {
  try {
    const res = await fetch('http://localhost:3000/api/entries', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function Home() {
  const entries = await getRecentEntries();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="flex gap-3 mb-8">
        <Link href="/cycle" className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-sm font-medium">Log Cycle</Link>
        <Link href="/hrt" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-medium">Log HRT</Link>
        <Link href="/settings" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-medium">Settings</Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Entries</h2>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm">No entries yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e: { id: string; module_id: string; data: Record<string, unknown>; created_at: string }) => (
            <li key={e.id} className="bg-gray-800 rounded p-3 text-sm">
              <div className="text-gray-400 text-xs mb-1">{new Date(e.created_at).toLocaleString()}</div>
              <pre className="text-gray-200 text-xs whitespace-pre-wrap">{JSON.stringify(e.data, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

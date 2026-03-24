import Link from 'next/link';

export default function Nav() {
  return (
    <nav
      className="px-4 py-3 flex gap-4 text-sm font-medium border-b flex-wrap"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <Link href="/" className="min-h-[44px] flex items-center hover:underline" style={{ color: "var(--accent)" }}>Home</Link>
      <Link href="/cycle" className="min-h-[44px] flex items-center hover:underline" style={{ color: "var(--accent)" }}>Log Cycle</Link>
      <Link href="/calendar" className="min-h-[44px] flex items-center hover:underline" style={{ color: "var(--accent)" }}>Calendar</Link>
      <Link href="/hrt" className="min-h-[44px] flex items-center hover:underline" style={{ color: "var(--accent)" }}>Log HRT</Link>
      <Link href="/settings" className="min-h-[44px] flex items-center hover:underline" style={{ color: "var(--accent)" }}>Settings</Link>
    </nav>
  );
}

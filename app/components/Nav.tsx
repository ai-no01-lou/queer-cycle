import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex gap-6 text-sm">
      <Link href="/" className="hover:text-pink-400">Home</Link>
      <Link href="/cycle" className="hover:text-pink-400">Log Cycle</Link>
      <Link href="/hrt" className="hover:text-pink-400">Log HRT</Link>
      <Link href="/settings" className="hover:text-pink-400">Settings</Link>
    </nav>
  );
}

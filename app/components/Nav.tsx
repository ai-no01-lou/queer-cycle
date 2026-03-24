import Link from 'next/link';
import { Home, CalendarDays, Activity, Syringe, Settings } from 'lucide-react';

const links = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/cycle', label: 'Log Cycle', Icon: Activity },
  { href: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { href: '/hrt', label: 'Log HRT', Icon: Syringe },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export default function Nav() {
  return (
    <>
      {/* Desktop: top bar with text links */}
      <nav
        className="hidden sm:flex px-4 py-3 gap-4 text-sm font-medium border-b flex-wrap"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="min-h-[44px] flex items-center hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Mobile: fixed bottom icon bar */}
      <nav
        className="flex sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t justify-around"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center py-3 flex-1 min-h-[56px]"
            style={{ color: 'var(--accent)' }}
            aria-label={label}
          >
            <Icon size={22} />
          </Link>
        ))}
      </nav>

      {/* Mobile bottom spacer so content isn't hidden behind fixed nav */}
      <div className="flex sm:hidden h-[56px]" aria-hidden="true" />
    </>
  );
}

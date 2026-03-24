'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, RefreshCw, Calendar, Pill, Settings } from 'lucide-react';

const BASE = '/queer-cycle';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cycle', label: 'Cycle', icon: RefreshCw },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/medications', label: 'Meds', icon: Pill },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const HIDDEN_PATHS = ['/login', '/register'];

export default function Nav() {
  const pathname = usePathname();

  // Strip basePath prefix for comparison
  const strippedPath = pathname.startsWith(BASE)
    ? pathname.slice(BASE.length) || '/'
    : pathname;

  const isHidden = HIDDEN_PATHS.some(
    (p) =>
      strippedPath.startsWith(p) ||
      pathname.startsWith(p) ||
      pathname.startsWith(`${BASE}${p}`)
  );

  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-pb">
      <div className="flex items-stretch justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const fullHref = `${BASE}${href === '/' ? '' : href}`;
          const isActive =
            href === '/'
              ? strippedPath === '/' || strippedPath === ''
              : strippedPath.startsWith(href);

          return (
            <Link
              key={href}
              href={fullHref || BASE || '/'}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 text-xs transition-colors ${
                isActive
                  ? 'text-pink-500 dark:text-pink-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

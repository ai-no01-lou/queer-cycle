'use client';

import { usePathname } from 'next/navigation';
import Nav from './Nav';

const HIDDEN_ROUTES = ['/login', '/register'];

export default function ConditionalNav() {
  const pathname = usePathname();
  if (HIDDEN_ROUTES.includes(pathname)) return null;
  return <Nav />;
}

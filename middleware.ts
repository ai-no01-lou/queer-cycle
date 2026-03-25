import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const PLATFORM_AUTH_URL = process.env.PLATFORM_AUTH_URL || 'http://api.localhost/auth';

function stripBasePath(pathname: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!basePath) return pathname;
  return pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname;
}

async function validateToken(token: string) {
  const res = await fetch(`${PLATFORM_AUTH_URL}/session/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (process.env.DEBUG_AUTH === '1') {
    console.log('[auth][middleware] session/me', res.status);
  }

  return res.ok;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const stripped = stripBasePath(pathname);

  // Allow public paths and API routes (API routes handle their own auth)
  if (
    PUBLIC_PATHS.some((p) => stripped.startsWith(p)) ||
    stripped.startsWith('/api/') ||
    stripped.startsWith('/_next/') ||
    stripped === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`;
    return NextResponse.redirect(url);
  }

  try {
    const ok = await validateToken(token);
    if (ok) return NextResponse.next();
  } catch {
    // fall through to redirect
  }

  const url = req.nextUrl.clone();
  url.pathname = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`;
  const response = NextResponse.redirect(url);
  response.cookies.delete('token');
  response.cookies.delete('refresh_token');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/register'];

async function validateToken(token: string) {
  try {
    await verifyToken(token);

    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] verifyToken ok');
    }

    return true;
  } catch {
    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] verifyToken failed');
    }
    return false;
  }
}

export async function middleware(req: NextRequest) {
  // In Next.js 13+, req.nextUrl.pathname already has the basePath stripped.
  // Never manually prepend basePath to redirect targets — NextURL re-adds it automatically.
  const { pathname } = req.nextUrl;

  if (process.env.DEBUG_AUTH === '1') {
    console.log('[auth][middleware] inbound', { pathname });
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Allow API routes and static/internal paths (API routes handle their own auth)
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] allow internal path', { pathname });
    }
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  if (isPublicPath) {
    if (!token) {
      if (process.env.DEBUG_AUTH === '1') {
        console.log('[auth][middleware] public path without token -> next', { pathname });
      }
      return NextResponse.next();
    }

    try {
      const ok = await validateToken(token);
      if (ok) {
        if (process.env.DEBUG_AUTH === '1') {
          console.log('[auth][middleware] authenticated user on public path -> redirect home', { pathname });
        }
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    } catch {
      // fall through to clear invalid cookies + allow public page
    }

    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] invalid token on public path -> clear cookies + next', { pathname });
    }
    const response = NextResponse.next();
    response.cookies.delete('token');
    response.cookies.delete('refresh_token');
    return response;
  }

  if (!token) {
    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] missing token -> redirect /login', { pathname });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const ok = await validateToken(token);
    if (ok) {
      if (process.env.DEBUG_AUTH === '1') {
        console.log('[auth][middleware] token valid -> next', { pathname });
      }
      return NextResponse.next();
    }
  } catch {
    // fall through to redirect
  }

  if (process.env.DEBUG_AUTH === '1') {
    console.log('[auth][middleware] token invalid/error -> redirect + clear cookies', { pathname });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  const response = NextResponse.redirect(url);
  response.cookies.delete('token');
  response.cookies.delete('refresh_token');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

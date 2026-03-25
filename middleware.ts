import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/register'];
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function withBasePath(pathname: string) {
  return `${BASE_PATH}${pathname}`;
}

function appHomePath() {
  return BASE_PATH || '/';
}

function stripBasePath(pathname: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!basePath) return pathname;
  return pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname;
}

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
  const { pathname } = req.nextUrl;
  const stripped = stripBasePath(pathname);

  if (process.env.DEBUG_AUTH === '1') {
    console.log('[auth][middleware] inbound', { pathname, stripped });
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => stripped.startsWith(p));

  // Allow API routes and static/internal paths (API routes handle their own auth)
  if (stripped.startsWith('/api/') || stripped.startsWith('/_next/') || stripped === '/favicon.ico') {
    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] allow internal path', { stripped });
    }
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  if (isPublicPath) {
    if (!token) {
      if (process.env.DEBUG_AUTH === '1') {
        console.log('[auth][middleware] public path without token -> next', { stripped });
      }
      return NextResponse.next();
    }

    try {
      const ok = await validateToken(token);
      if (ok) {
        if (process.env.DEBUG_AUTH === '1') {
          console.log('[auth][middleware] authenticated user on public path -> redirect home', {
            stripped,
          });
        }
        const url = req.nextUrl.clone();
        url.pathname = appHomePath();
        return NextResponse.redirect(url);
      }
    } catch {
      // fall through to clear invalid cookies + allow public page
    }

    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] invalid token on public path -> clear cookies + next', {
        stripped,
      });
    }
    const response = NextResponse.next();
    response.cookies.delete('token');
    response.cookies.delete('refresh_token');
    return response;
  }
  if (!token) {
    if (process.env.DEBUG_AUTH === '1') {
      console.log('[auth][middleware] missing token -> redirect /login', { stripped });
    }
    const url = req.nextUrl.clone();
    url.pathname = withBasePath('/login');
    return NextResponse.redirect(url);
  }

  try {
    const ok = await validateToken(token);
    if (ok) {
      if (process.env.DEBUG_AUTH === '1') {
        console.log('[auth][middleware] token valid -> next', { stripped });
      }
      return NextResponse.next();
    }
  } catch {
    // fall through to redirect
  }

  if (process.env.DEBUG_AUTH === '1') {
    console.log('[auth][middleware] token invalid/error -> redirect + clear cookies', { stripped });
  }
  const url = req.nextUrl.clone();
  url.pathname = withBasePath('/login');
  const response = NextResponse.redirect(url);
  response.cookies.delete('token');
  response.cookies.delete('refresh_token');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

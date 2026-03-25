// Client-side helper for calling same-origin API routes with consistent
// cookie behavior + a single 401 redirect.

let redirected401 = false;

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const res = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && typeof window !== 'undefined' && !redirected401) {
    redirected401 = true;
    // Avoid loops: only redirect if we're not already on /login
    if (!window.location.pathname.endsWith('/login')) {
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`;
    }
  }

  return res;
}

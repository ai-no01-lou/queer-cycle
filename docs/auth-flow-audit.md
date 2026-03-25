# Auth flow audit (Sub-task 1)

Date: 2026-03-25

## Where `session/me` is called

### 1) Edge middleware (server-side route gate)
- File: `middleware.ts`
- Function: `middleware()` → `validateToken(token)`
- Call: `GET ${PLATFORM_AUTH_URL}/session/me`
- Trigger: every non-public page request (anything except `/login`, `/register`, `/api/*`, `/_next/*`, `/favicon.ico`)

### 2) Client auth bootstrap (React provider)
- File: `app/providers/AuthProvider.tsx`
- Function: `useEffect([])` on provider mount → `refresh('AuthProvider.useEffect:boot')` → `fetchMeOnce(...)`
- Call: `GET /api/auth/me` (same-origin API route)
- Then API route calls platform `session/me`:
  - File: `app/api/auth/me/route.ts`
  - Function: `GET(req)` → `fetchPlatformSession(token)`
  - File: `lib/platformAuth.ts` calls `GET ${PLATFORM_AUTH_URL}/session/me`

### 3) Post-login auth refresh
- File: `app/login/page.tsx`
- Function: `handleSubmit()`
- After successful `/api/auth/login`, it calls `refresh('LoginPage.handleSubmit:post-login')` which calls `/api/auth/me` again.

## Current routing/auth decision points

### Middleware (`middleware.ts`)
1. Strip base path for matching.
2. If path is public/internal (`/login`, `/register`, `/api/*`, `/_next/*`, `/favicon.ico`) → allow.
3. If no `token` cookie → redirect to `/login`.
4. If `token` exists → validate with platform `session/me`.
5. If valid → allow.
6. If invalid/error → redirect to `/login` and delete `token` + `refresh_token` cookies.

### API client (`lib/apiClient.ts`)
1. All client API requests go through `apiFetch`.
2. On first `401`, sets `redirected401 = true` and redirects to `/login` unless already on `/login`.
3. Subsequent `401`s in the same browser runtime do not auto-redirect (guarded by `redirected401`).

### Auth provider (`app/providers/AuthProvider.tsx`)
1. On mount, always checks session once via `refresh()`.
2. `refresh` sets `loading=true`, calls `/api/auth/me`, updates `user`, then `loading=false`.
3. `fetchMeOnce` deduplicates only while request is in-flight (not across remounts).

### Login page (`app/login/page.tsx`)
1. If `!authLoading && user`, redirect to `/`.
2. On submit success: call `refresh()`, then `router.replace('/')`, then `router.refresh()`.

## Root cause identified

The repeated auth checks come from **two independent guards firing in sequence**, plus dev remount behavior:

1. **Middleware guard** validates token via `session/me` on protected route requests.
2. **Client AuthProvider boot effect** always calls `/api/auth/me` (which again calls platform `session/me`) after hydration.

So one navigation to a protected page can produce:
- middleware `session/me` (edge)
- then provider `/api/auth/me` → platform `session/me` (client boot)

In development, `reactStrictMode: true` can remount and re-run the provider effect, increasing duplicate calls.

This is the call-site/dependency loop pattern:
- route transition/login success → render layout (with `AuthProvider`) → provider boot refresh → `/api/auth/me` → apiFetch 401 handling/redirect logic and login-page effect can trigger additional navigations.

## Repro steps

1. Set env:
   - `DEBUG_AUTH=1`
   - `NEXT_PUBLIC_DEBUG_AUTH=1`
2. Start app in dev mode.
3. Open browser console + server logs.
4. Visit `/login` while logged out.
   - Observe provider boot refresh calling `/api/auth/me`.
   - Observe `401` and `apiFetch` skip-redirect if already on login.
5. Log in successfully.
   - Observe `/api/auth/login` then `refresh('LoginPage.handleSubmit:post-login')` → `/api/auth/me`.
   - Observe navigation to `/`.
6. Hard refresh `/`.
   - Observe middleware `session/me`, then provider `/api/auth/me` call.

## Expected vs actual

### Expected
- Single clear auth source of truth per navigation/bootstrap.
- Minimal `session/me` calls (ideally one at boot + one on explicit refresh/login).
- No redundant redirects.

### Actual
- Auth is checked in both middleware and provider bootstrap path.
- Platform `session/me` is called multiple times for one user journey.
- In dev strict mode, remount can make duplicates appear loop-like.

## Temporary instrumentation added

- `app/providers/AuthProvider.tsx`
  - logs for `useEffect` boot, `refresh:start/done`, `fetchMeOnce:start/reuse/non-ok/done`
  - request header tag: `x-auth-probe-source`
- `app/login/page.tsx`
  - logs login-page effect state and redirect decision
  - tags login call with `x-auth-probe-source`
- `lib/apiClient.ts`
  - logs request/response path+status
  - logs 401 redirect/skip decision
- `middleware.ts`
  - logs route gating decisions (allow public, missing token redirect, valid token next, invalid token redirect)
- `app/api/auth/me/route.ts`
  - logs `probeSource` and token presence
- `.env.example`
  - includes `DEBUG_AUTH=1` and `NEXT_PUBLIC_DEBUG_AUTH=1`

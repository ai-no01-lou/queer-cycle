type ApiClientOptions = {
  baseUrl?: string;
  credentials?: RequestCredentials;
};

type UnauthorizedHandler = () => void;

type SessionSnapshot = {
  ok: boolean;
  status: number;
  user: unknown;
};

const unauthorizedHandlers = new Set<UnauthorizedHandler>();
let inflightSession: Promise<SessionSnapshot> | null = null;

function toPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function normalizeUrl(input: RequestInfo | URL, baseUrl: string): RequestInfo | URL {
  if (typeof input !== 'string') return input;
  if (/^https?:\/\//i.test(input)) return input;

  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const path = input.startsWith('/') ? input : `/${input}`;
  return `${base}${path}`;
}

function notifyUnauthorized() {
  unauthorizedHandlers.forEach((handler) => {
    try {
      handler();
    } catch {
      // no-op: auth state listeners must not crash requests
    }
  });
}

function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const credentials = options.credentials ?? 'same-origin';

  async function request(input: RequestInfo | URL, init: RequestInit = {}) {
    const path = toPath(input);

    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
      console.log('[auth][client][apiFetch] request', {
        path,
        method: init.method ?? 'GET',
        probeSource:
          init.headers && init.headers instanceof Headers
            ? init.headers.get('x-auth-probe-source')
            : (init.headers as Record<string, string> | undefined)?.['x-auth-probe-source'],
      });
    }

    const res = await fetch(normalizeUrl(input, baseUrl), {
      ...init,
      credentials,
      headers: {
        ...(init.headers ?? {}),
      },
    });

    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
      console.log('[auth][client][apiFetch] response', {
        path,
        status: res.status,
      });
    }

    if (res.status === 401 && typeof window !== 'undefined') {
      notifyUnauthorized();
    }

    return res;
  }

  async function getSession(source = 'AuthProvider.refresh'): Promise<SessionSnapshot> {
    if (!inflightSession) {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
        console.log('[auth][client][apiFetch] session:start', { source });
      }

      inflightSession = request('/api/auth/me', {
        method: 'GET',
        headers: {
          'x-auth-probe-source': source,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            return { ok: false, status: res.status, user: null };
          }

          const data = (await res.json()) as { user?: unknown };
          return {
            ok: true,
            status: res.status,
            user: data.user ?? null,
          };
        })
        .finally(() => {
          inflightSession = null;

          if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
            console.log('[auth][client][apiFetch] session:done', { source });
          }
        });
    } else if (process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
      console.log('[auth][client][apiFetch] session:reuse-inflight', { source });
    }

    return inflightSession;
  }

  return {
    request,
    getSession,
  };
}

const apiClient = createApiClient();

export const apiFetch = apiClient.request;
export const fetchSession = apiClient.getSession;

export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

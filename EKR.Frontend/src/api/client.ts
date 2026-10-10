import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5015/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

/** In-memory token so requests work before redux-persist flushes to localStorage. */
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export function setAuthTokens(token: string | null, refreshToken?: string | null) {
  memoryAccessToken = token;
  if (refreshToken !== undefined) memoryRefreshToken = refreshToken;
}

type PersistedAuth = {
  session?: string | { token?: string; refreshToken?: string } | null;
};

function readPersistedSession(): { token?: string; refreshToken?: string } | null {
  const raw = localStorage.getItem('persist:zeir-auth');
  if (!raw) return null;
  try {
    const persisted = JSON.parse(raw) as PersistedAuth;
    const sessionRaw = persisted.session;
    if (!sessionRaw || sessionRaw === 'null') return null;
    return typeof sessionRaw === 'string' ? JSON.parse(sessionRaw) : sessionRaw;
  } catch {
    return null;
  }
}

function writePersistedTokens(token: string, refreshToken: string, tokenExpiry: string) {
  memoryAccessToken = token;
  memoryRefreshToken = refreshToken;
  const raw = localStorage.getItem('persist:zeir-auth');
  if (!raw) return;
  try {
    const persisted = JSON.parse(raw) as PersistedAuth & Record<string, string>;
    const sessionRaw = persisted.session;
    if (!sessionRaw || sessionRaw === 'null') return;
    const session =
      typeof sessionRaw === 'string' ? JSON.parse(sessionRaw) : { ...sessionRaw };
    session.token = token;
    session.refreshToken = refreshToken;
    session.tokenExpiry = tokenExpiry;
    persisted.session = JSON.stringify(session);
    localStorage.setItem('persist:zeir-auth', JSON.stringify(persisted));
  } catch {
    /* ignore */
  }
}

api.interceptors.request.use((config) => {
  if (config.headers.Authorization) return config;
  const session = readPersistedSession();
  const token = memoryAccessToken || session?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const session = readPersistedSession();
  const refreshToken = memoryRefreshToken || session?.refreshToken;
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(
      `${API_BASE}/Auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const payload = data?.data ?? data?.Data ?? data;
    if (!payload?.token) return null;
    writePersistedTokens(
      payload.token,
      payload.refreshToken,
      String(payload.tokenExpiry ?? '')
    );
    return payload.token as string;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    if (original.url?.includes('/Auth/login') || original.url?.includes('/Auth/refresh')) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
);

export interface ApiResponse<T> {
  isSuccess: boolean;
  message?: string;
  data?: T;
  success?: boolean;
}

import { CulturalItem } from '../data/culturalContent.js';
import {
  InfoCulturaEvent,
  InfoCulturaNews,
  InfoCulturaRegistration,
} from './types.js';
import { pushToast } from '../utils/toast.js';

const clientEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE = (clientEnv?.VITE_INFOCULTURA_API || 'http://127.0.0.1:8001/api/').replace(
  /\/$/,
  ''
);
const ACCESS_TOKEN_STORAGE_KEY = 'ispgaya_cultura_token';
let inMemoryAccessToken = '';

declare global {
  interface Window {
    __INFOCULTURA_ACCESS_TOKEN__?: string;
  }
}

export type ApiListResponse = {
  items: CulturalItem[];
};

export type ApiItemResponse<T = CulturalItem> = {
  item: T;
};

export type ApiPublicRegistrationResponse = {
  message: string;
  status: string;
  registration_id: number;
};

export type ApiImageUploadResponse = {
  path: string;
};

export type ApiBulkNewsResponse = {
  items: InfoCulturaNews[];
  updated: number;
};

export type ApiBulkEventResponse = {
  items: InfoCulturaEvent[];
  updated: number;
};

export type ApiBulkRegistrationResponse = {
  items: InfoCulturaRegistration[];
  updated: number;
};

export type ApiBulkDeleteResponse = {
  deleted: number;
};

export class InfoCulturaApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'InfoCulturaApiError';
    this.status = status;
  }
}

export function getStoredAccessToken(): string {
  if (typeof window !== 'undefined') {
    const windowToken = window.__INFOCULTURA_ACCESS_TOKEN__ || '';
    if (windowToken) {
      inMemoryAccessToken = windowToken;
      return windowToken;
    }

    const storedToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || '';
    if (storedToken) {
      inMemoryAccessToken = storedToken;
      window.__INFOCULTURA_ACCESS_TOKEN__ = storedToken;
      return storedToken;
    }
  }

  return inMemoryAccessToken;
}

export function setStoredAccessToken(token: string): void {
  inMemoryAccessToken = token || '';
  if (typeof window === 'undefined') return;
  window.__INFOCULTURA_ACCESS_TOKEN__ = inMemoryAccessToken;
  if (inMemoryAccessToken) {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, inMemoryAccessToken);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    delete window.__INFOCULTURA_ACCESS_TOKEN__;
  }
}

function extractApiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;

  const typedBody = body as Record<string, unknown>;

  if (typeof typedBody.message === 'string' && typedBody.message.trim()) {
    return typedBody.message;
  }

  const fieldMessages = Object.entries(typedBody)
    .flatMap(([field, value]) => {
      if (typeof value === 'string' && value.trim()) {
        return [`${field}: ${value}`];
      }

      if (Array.isArray(value)) {
        return value
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => (field === 'non_field_errors' ? item : `${field}: ${item}`));
      }

      return [];
    })
    .filter(Boolean);

  return fieldMessages.length > 0 ? fieldMessages.join(' ') : null;
}

function notifyApiError(message: string, status: number): void {
  const tone = status >= 500 ? 'error' : status === 403 || status === 409 ? 'warning' : 'error';
  const title =
    status === 401
      ? 'Sessão expirada'
      : status === 403
        ? 'Sem permissão'
        : status === 404
          ? 'Recurso não encontrado'
          : status === 409
            ? 'Ação bloqueada'
            : 'Erro';

  pushToast({
    title,
    message,
    tone
  });
}

function shouldNotifySuccess(path: string, method: string): boolean {
  const upperMethod = method.toUpperCase();

  if (upperMethod === 'GET' || upperMethod === 'HEAD') {
    return false;
  }

  if (
    path === '/auth/login/' ||
    path === '/auth/logout/' ||
    path === '/auth/refresh/' ||
    path === '/metrics/view/'
  ) {
    return false;
  }

  return true;
}

function notifyApiSuccess(path: string, method: string): void {
  const upperMethod = method.toUpperCase();
  const title = upperMethod === 'DELETE' ? 'Removido' : 'Guardado';
  const message =
    upperMethod === 'DELETE'
      ? 'A remoção foi concluída com sucesso.'
      : 'A alteração foi concluída com sucesso.';

  if (!shouldNotifySuccess(path, upperMethod)) {
    return;
  }

  pushToast({
    title,
    message,
    tone: 'success'
  });
}

let refreshTokenPromise: Promise<string | null> | null = null;

async function refreshInfoCulturaToken(): Promise<string | null> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    const response = await fetch(`${API_BASE}/auth/refresh/`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      setStoredAccessToken('');
      return null;
    }

    const body = (await response.json()) as { token?: string };
    const nextToken = body.token || '';
    setStoredAccessToken(nextToken);
    return nextToken || null;
  })();

  try {
    return await refreshTokenPromise;
  } finally {
    refreshTokenPromise = null;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  allowRefresh = true
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  const resolvedToken = getStoredAccessToken() || token;
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!headers.has('Content-Type') && options.body && !isFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (resolvedToken) {
    headers.set('Authorization', `Token ${resolvedToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (
    response.status === 401 &&
    allowRefresh &&
    path !== '/auth/login/' &&
    path !== '/auth/refresh/' &&
    path !== '/auth/logout/'
  ) {
    const refreshedToken = await refreshInfoCulturaToken();
    if (refreshedToken) {
      return request<T>(path, options, refreshedToken, false);
    }
  }

  if (!response.ok) {
    let message = 'Erro ao comunicar com o servidor.';

    try {
      const body = (await response.json()) as unknown;
      const extractedMessage = extractApiErrorMessage(body);
      if (extractedMessage) {
        message = extractedMessage;
      }
    } catch {
      // ignore parse errors and use default message
    }

    notifyApiError(message, response.status);

    throw new InfoCulturaApiError(message, response.status);
  }

  if (response.status === 204) {
    notifyApiSuccess(path, method);
    return undefined as T;
  }

  if (shouldNotifySuccess(path, method)) {
    notifyApiSuccess(path, method);
  }

  return (await response.json()) as T;
}

export async function requestBlob(
  path: string,
  options: RequestInit = {},
  token?: string,
  allowRefresh = true
): Promise<Blob> {
  const headers = new Headers(options.headers);
  const resolvedToken = getStoredAccessToken() || token;
  if (resolvedToken) {
    headers.set('Authorization', `Token ${resolvedToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (
    response.status === 401 &&
    allowRefresh &&
    path !== '/auth/refresh/' &&
    path !== '/auth/logout/'
  ) {
    const refreshedToken = await refreshInfoCulturaToken();
    if (refreshedToken) {
      return requestBlob(path, options, refreshedToken, false);
    }
  }

  if (!response.ok) {
    let message = 'Erro ao comunicar com o servidor.';
    try {
      const body = (await response.json()) as unknown;
      const extractedMessage = extractApiErrorMessage(body);
      if (extractedMessage) {
        message = extractedMessage;
      }
    } catch {
      // ignore
    }
    notifyApiError(message, response.status);
    throw new InfoCulturaApiError(message, response.status);
  }

  return response.blob();
}

function getApiOrigin(): string {
  try {
    return new URL(API_BASE).origin;
  } catch {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return '';
  }
}

export function resolveInfoCulturaAssetUrl(value?: string | null): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    return `${getApiOrigin()}${value}`;
  }

  return `${getApiOrigin()}/${value.replace(/^\/+/, '')}`;
}

export function isInfoCulturaAuthError(error: unknown): error is InfoCulturaApiError {
  return error instanceof InfoCulturaApiError && (error.status === 401 || error.status === 403);
}

export function normalizeItemsResponse(data: ApiListResponse | CulturalItem[]): CulturalItem[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.items)) {
    return data.items;
  }

  if (data && 'results' in data && Array.isArray(data.results)) {
    return data.results as CulturalItem[];
  }

  return [];
}

export function normalizeItemResponse<T extends object = CulturalItem>(data: ApiItemResponse<T> | T): T {
  if ('item' in data) {
    return data.item;
  }

  return data;
}

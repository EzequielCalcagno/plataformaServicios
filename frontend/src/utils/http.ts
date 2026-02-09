// src/utils/http.ts
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = (Constants.expoConfig?.extra?.API_URL as string | undefined) ?? '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface HttpOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  token?: string | null;
  timeoutMs?: number;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: HttpOptions['query']): string {
  const base = API_URL?.replace(/\/+$/, '') ?? '';
  const fullPath = path.startsWith('http') ? path : `${base}${path}`;

  if (!query) return fullPath;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });

  const qs = params.toString();
  return qs ? `${fullPath}?${qs}` : fullPath;
}

export async function http<T = any>(path: string, opts: HttpOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    token: explicitToken,
    timeoutMs = 12000,
    query,
  } = opts;

  const storedToken = await AsyncStorage.getItem('@token');
  const token = explicitToken ?? storedToken;

  const url = buildUrl(path, query);
  console.log('🌐 Fetching:', method, url);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders: Record<string, string> = {
    ...headers,
  };

  // Solo setear Content-Type cuando NO sea FormData
  const isFormData = body instanceof FormData;
  if (!isFormData && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const finalBody =
    body == null
      ? undefined
      : typeof body === 'string' || body instanceof FormData
        ? body
        : JSON.stringify(body);

  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
    });

    if (res.status === 204) return {} as T;

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError')
      throw new ApiError('Tiempo de espera agotado (timeout)', 408, null);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Error de red', 0, null);
  } finally {
    clearTimeout(id);
  }
}

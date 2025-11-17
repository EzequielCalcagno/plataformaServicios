import { API_BASE } from '../config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function http<T = any>(
  path: string,
  opts: {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
    token?: string | null;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
    timeoutMs = 12000, // 12s
  } = opts;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text(); // evita colgado por JSON inválido
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    if (!res.ok) {
      const msg = data?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Tiempo de espera agotado (timeout)');
    throw new Error(err?.message || 'Error de red');
  } finally {
    clearTimeout(id);
  }
}

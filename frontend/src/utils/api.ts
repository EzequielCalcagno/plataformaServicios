// src/utils/api.ts
import { http, HttpOptions } from './http';

type WithoutMethod = Omit<HttpOptions, 'method'>;

export const api = {
  get: <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'GET' }),

  post: <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'POST' }),

  put: <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'PUT' }),

  patch: <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'PATCH' }),

  delete: <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'DELETE' }),

  /**
   * ✅ Helpers para enviar JSON como body
   * (asumiendo que tu http() soporta opts.body)
   */
  postJson: <T = any>(path: string, body: unknown, opts: WithoutMethod = {}) =>
    http<T>(path, {
      ...opts,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    }),

  putJson: <T = any>(path: string, body: unknown, opts: WithoutMethod = {}) =>
    http<T>(path, {
      ...opts,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    }),

  patchJson: <T = any>(path: string, body: unknown, opts: WithoutMethod = {}) =>
    http<T>(path, {
      ...opts,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    }),

  deleteJson: <T = any>(path: string, body: unknown, opts: WithoutMethod = {}) =>
    http<T>(path, {
      ...opts,
      method: 'DELETE',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    }),
};

// src/utils/api.ts
import { http, HttpOptions } from './http';

type WithoutMethod = Omit<HttpOptions, 'method'>;

export const api = {
  get:  <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'GET' }),

  post: <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'POST' }),

  put:  <T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'PUT' }),

  patch:<T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'PATCH' }),

  delete:<T = any>(path: string, opts: WithoutMethod = {}) =>
    http<T>(path, { ...opts, method: 'DELETE' }),
};

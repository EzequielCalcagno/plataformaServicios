// src/utils/api.ts
import Constants from 'expo-constants';
import { http, HttpOptions } from './http';

// 🔹 Leemos la URL base desde app.json → extra.API_URL
const API_URL_FROM_EXTRA =
  (Constants.expoConfig?.extra as any)?.API_URL as string | undefined;

// 🔹 Fallbacks por si algún día cambian la forma de pasarlo
export const API_URL =
  API_URL_FROM_EXTRA ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.1.9:3000/api/v1'; // <- ajustá este fallback si cambiás IP/puerto

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

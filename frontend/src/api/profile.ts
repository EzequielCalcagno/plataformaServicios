import { http } from './http';
import { getToken } from './auth';

async function authGet<T = any>(path: string) {
  const token = await getToken();
  if (!token) throw new Error('No autenticado');
  return http<T>(path, { headers: { Authorization: `Bearer ${token}` } });
}

export const getMe = () => authGet('/v1/me');                        // opcional
export const getMyProfessionalProfile = () => authGet('/v1/profiles/me');

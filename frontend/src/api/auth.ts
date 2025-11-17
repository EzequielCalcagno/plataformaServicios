import AsyncStorage from '@react-native-async-storage/async-storage';
import { http } from './http';

const TOKEN_KEY = 'pds_token';

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string) {
  const data = await http('/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  // { token, usuario }
  await saveToken(data.token);
  return data;
}

export async function register(payload: {
  nombre: string; apellido: string; email: string; password: string;
  telefono?: string; ciudad?: string; rol: 'cliente' | 'profesional';
}) {
  const data = await http('/v1/auth/register', {
    method: 'POST',
    body: payload,
  });
  await saveToken(data.token);
  return data;
}

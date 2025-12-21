// src/services/auth.client.ts
import { api } from '../utils/api';

export type LoginResponse = {
  token: string;
};

type RegisterRequest = {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
};

export async function login(email: string, password: string) {
  const data = await api.post<LoginResponse>('/auth/login', {
    body: { email, password },
  });

  return data.token;
}

export async function register(data: RegisterRequest) {
  return api.post<{ message: string }>('/auth/register', {
    body: data,
  });
}

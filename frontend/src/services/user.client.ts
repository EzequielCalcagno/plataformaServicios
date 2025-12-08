// src/services/user.client.ts
import { api } from '../utils/api';

export type UserResponse = {
  activo: boolean;
  apellido?: string;
  nombre?: string;
  telefono?: string;
  email: string;
  foto_url?: string;
  id_rol: number;
};

export async function getCurrentUser() {
  const data = await api.get<UserResponse>('/private/currentUser');
  return data;
}

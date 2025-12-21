// src/services/user.client.ts
import { api } from '../utils/api';

export type UserResponse = {
  apellido?: string;
  nombre?: string;
  telefono?: string;
  email: string;
  foto_url?: string;
  id_rol: number;
  fecha_registro: string;
  verificado: boolean;
};

export async function getCurrentUser() {
  const data = await api.get<UserResponse>('/private/currentUser');
  return data;
}

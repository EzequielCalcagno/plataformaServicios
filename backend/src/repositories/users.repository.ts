// src/repositories/auth.repository.ts
import db from '../config/db';
import { UserSchema } from '../schemas/user.schema';

export const getUserByEmailRepository = async (email: string) => {
  const { data, error } = await db.from('usuarios').select('*').eq('email', email).single();

  if (error) {
    if ((error as any).code === 'PGRST116') {
      return null; // no encontrado
    }
    throw error;
  }

  return UserSchema.parse(data);
};

export const getUserByIdRepository = async (id: string) => {
  const { data, error } = await db.from('usuarios').select('*').eq('id', id).single();

  if (error) {
    if ((error as any).code === 'PGRST116') {
      return null; // no encontrado
    }
    throw error;
  }

  return UserSchema.parse(data);
};

export const getAllUsersRepository = async () => {
  const { data, error } = await db.from('usuarios').select('*');
  if (error) {
    console.error('❌ Error en getAllUsersRepository:', error);
    throw error;
  }

  return UserSchema.parse(data);
};

export const updateLastLogin = async (id: string) => {
  const { error } = await db
    .from('usuarios')
    .update({ ultimo_login: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('❌ Error en updateLastLogin:', error);
    throw error;
  }
};

export type NewUser = {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  contrasena_hash: string;
  id_rol: number | null;
  telefono: string | null;
};

// Función para crear un nuevo usuario
export const createUserRepository = async (user: NewUser) => {
  const payload = {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido ?? null,
    email: user.email,
    contrasena_hash: user.contrasena_hash,
    telefono: user.telefono ?? null,
    id_rol: user.id_rol,
  };

  const { data, error } = await db.from('usuarios').insert(payload).select('*').single();

  if (error) {
    console.error('❌ Error en createUserRepository:', error);
    throw error;
  }

  return data;
};

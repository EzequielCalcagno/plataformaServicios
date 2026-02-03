// src/repositories/users.repository.ts
import db from '../config/db';
import { z } from 'zod';
import { UserSchema } from '../schemas/user.schema';

const UsersArraySchema = z.array(UserSchema);

export const getUserByEmailRepository = async (email: string) => {
  const { data, error } = await db.from('usuarios').select('*').eq('email', email).single();

  if (error) {
    if ((error as any).code === 'PGRST116') return null;
    throw error;
  }

  return UserSchema.parse(data);
};

export const getUserByIdRepository = async (id: string) => {
  const { data, error } = await db.from('usuarios').select('*').eq('id', id).single();

  if (error) {
    if ((error as any).code === 'PGRST116') return null;
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

  return UsersArraySchema.parse(data ?? []);
};

// ✅ guardar la url pública en usuarios.foto_url
export const updateUserPhotoUrlRepository = async (id: string, foto_url: string) => {
  const { data, error } = await db
    .from('usuarios')
    .update({ foto_url })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Error en updateUserPhotoUrlRepository:', error);
    throw error;
  }

  return UserSchema.parse(data);
};

// ✅ esto faltaba y tu login lo necesita
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

// ✅ esto también faltaba y tu register lo necesita
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

  return UserSchema.parse(data);
};

// ✅ traer usuarios básicos por IDs (para Search)
export const getUsersBasicByIdsRepository = async (ids: string[]) => {
  if (!ids || ids.length === 0) return [];

  const { data, error } = await db
    .from('usuarios')
    .select('id, nombre, apellido, foto_url')
    .in('id', ids);

  if (error) {
    console.error('❌ Error en getUsersBasicByIdsRepository:', error);
    throw error;
  }

  return data ?? [];
};

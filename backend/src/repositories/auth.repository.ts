// src/repositories/auth.repository.ts
import db from '../config/db';

// Función para obtener un usuario por email
export const getUserByEmailRepository = async (email: string) => {
  const { data, error } = await db
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('❌ Error en getUserByEmailRepository:', error);
    throw error;
  }

  return data || null;
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
    id_rol: user.id_rol,
    telefono: user.telefono ?? null,  
  };

  const { data, error } = await db
    .from('usuarios')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Error en createUserRepository:', error);
    throw error;
  }

  return data;
};

// src/repositories/auth.repository.ts
import db from '../config/db';

export type NewUser = {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  contrasena_hash: string;
  id_rol: number;
  telefono: string | null; 
};

export const getUserByEmailRepository = async (email: string) => {
  const { data, error } = await db
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if ((error as any).code === 'PGRST116') {
      return null; // no encontrado
    }
    throw error;
  }

  return data;
};

export const createUserRepository = async (user: NewUser) => {
  const { error } = await db.from('usuarios').insert({
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    contrasena_hash: user.contrasena_hash,
    id_rol: user.id_rol,
    telefono: user.telefono,  
  });

  if (error) throw error;
};

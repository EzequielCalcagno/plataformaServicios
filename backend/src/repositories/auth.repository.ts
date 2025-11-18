// src/repositories/auth.repository.ts
import db from '../config/db';

//Función para obtener un usuario por email
export const getUserByEmailRepository = async (email: string) => {
  const { data, error } = await db.from('usuarios').select('*').eq('email', email).single();

  if (error) {
    console.error('❌ Error en getUserByEmailRepository:', error);
    throw error;
  }

  return data || null;
};

// Función para crear un nuevo usuario
export const createUserRepository = async (email: string, passwordHash: string, rol: string) => {
  const { data, error } = await db.from('usuarios').insert({
    email,
    password_hash: passwordHash,
    rol,
  });

  if (error) {
    console.error('❌ Error en createUserRepository:', error);
    throw error;
  }

  return data;
};

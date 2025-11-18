// src/services/auth.service.ts
import { getUserByEmailRepository } from '../repositories/auth.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const loginService = async (email: string, password: string) => {
  // Lógica de login
  const user = await getUserByEmailRepository(email);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const isValidPassword = await comparePasswords(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Contraseña incorrecta');
  }

  return user;
};

export const registerService = async (email: string, password: string, rol: string) => {
  // Lógica de registro
};

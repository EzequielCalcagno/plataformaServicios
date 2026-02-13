// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  getUserByEmailRepository,
  createUserRepository,
  updateLastLogin,
} from '../repositories/users.repository';
import { getNextClienteId, getNextProfesionalId } from '../repositories/id.repository';
import { ROLES, RoleKey } from '../constants/roles';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '1h';
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

export const loginService = async (email: string, password: string) => {
  const user = await getUserByEmailRepository(email);

  if (!user) throw new Error('INVALID_CREDENTIALS');

  const isValidPassword = await bcrypt.compare(password, user.contrasena_hash);
  if (!isValidPassword) throw new Error('INVALID_CREDENTIALS');

  if (!user.id) throw new Error('USER_ID_MISSING');

  await updateLastLogin(String(user.id));

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      rolId: user.id_rol,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  return token;
};

type RegisterParams = {
  email: string;
  password: string;
  rolCode: RoleKey;
  nombre?: string;
  apellido?: string;
  telefono?: string;
};

export const registerService = async ({
  email,
  password,
  rolCode,
  nombre,
  apellido,
  telefono,
}: RegisterParams) => {
  const existingUser = await getUserByEmailRepository(email);
  if (existingUser) {
    throw new Error('EMAIL_ALREADY_REGISTERED');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const rolId = ROLES[rolCode].id;

  let id: string;
  if (rolCode === 'CLIENTE') {
    id = await getNextClienteId();
  } else if (rolCode === 'PROFESIONAL') {
    id = await getNextProfesionalId();
  } else {
    id = 'admin_' + Date.now();
  }

  const nombreFinal = nombre && nombre.trim().length > 0 ? nombre : 'Usuario';

  await createUserRepository({
    id,
    nombre: nombreFinal,
    apellido: apellido ?? null,
    email,
    contrasena_hash: passwordHash,
    telefono: telefono ?? null,
    id_rol: rolId,
  });
};

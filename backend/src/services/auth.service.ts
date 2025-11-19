// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// Repositories
import { getUserByEmailRepository, createUserRepository } from '../repositories/auth.repository';
import { getNextClienteId, getNextProfesionalId } from '../repositories/id.repository';
// Schemas
import { CrearUsuarioSchema } from '../schemas/user.schema';
// Constants
import { ROLES, RoleKey } from '../constants/roles';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '1h';
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

export const loginService = async (email: string, password: string) => {
  const user = await getUserByEmailRepository(email);

  if (!user) throw new Error('Usuario no encontrado');

  const isValidPassword = await bcrypt.compare(password, user.contrasena_hash);
  if (!isValidPassword) throw new Error('Contraseña incorrecta');

  // en la tabla usuarios tenés id_rol = 1 | 2 | 3
  const rolId = user.id_rol;

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      rolId,
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
};

export const registerService = async ({
  email,
  password,
  rolCode,
  nombre,
  apellido,
}: RegisterParams) => {
  const existingUser = await getUserByEmailRepository(email);
  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const rolId = ROLES[rolCode].id;

  // Generar ID según rol
  let id: string;
  if (rolCode === 'CLIENTE') {
    id = await getNextClienteId();
  } else if (rolCode === 'PROFESIONAL') {
    id = await getNextProfesionalId();
  } else {
    id = 'admin_' + Date.now(); // o le hacés otra secuencia
  }

  // Nombre obligatorio para cumplir con NOT NULL
  const nombreFinal = nombre && nombre.trim().length > 0 ? nombre : 'Usuario';

  await createUserRepository({
    id,
    nombre: nombreFinal,
    apellido: apellido ?? null,
    email,
    contrasena_hash: passwordHash,
    id_rol: rolId,
  });
};

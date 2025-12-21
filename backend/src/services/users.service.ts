import { getAllUsersRepository, getUserByIdRepository } from '../repositories/users.repository';
import type { User } from '../schemas/user.schema';

export const getAllUsersService = async () => {
  // acá podrías aplicar lógica de negocio en el futuro (ej: filtrar, transformar, etc.)
  const users = await getAllUsersRepository();
  return users;
};

export const getUserByIdService = async (id: string) => {
  const user = (await getUserByIdRepository(id)) as User;
  return user;
};

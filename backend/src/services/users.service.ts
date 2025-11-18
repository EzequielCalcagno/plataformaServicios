import { getAllUsersRepository, getUserByIdRepository } from '../repositories/users.repository';

export const getAllUsersService = async () => {
  // acá podrías aplicar lógica de negocio en el futuro (ej: filtrar, transformar, etc.)
  const users = await getAllUsersRepository();
  return users;
};

export const getUserByIdService = async (id: number) => {
  const user = await getUserByIdRepository(id);
  return user;
};

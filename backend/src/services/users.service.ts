// src/services/users.service.ts
import {
  getAllUsersRepository,
  getUserByIdRepository,
  updateUserPhotoUrlRepository,
} from '../repositories/users.repository';

import type { User } from '../schemas/user.schema';

export const getAllUsersService = async () => {
  const users = await getAllUsersRepository();
  return users;
};

export const getUserByIdService = async (id: string) => {
  const user = (await getUserByIdRepository(id)) as User;
  return user;
};

export const updateUserPhotoUrlService = async (id: string, fotoUrl: string) => {
  return updateUserPhotoUrlRepository(id, fotoUrl);
};

import db from '../config/db';

export const getAllUsersRepository = async () => {
  const { data, error } = await db.from('usuarios').select('*');
  if (error) throw error;
  return data;
};

export const getUserByIdRepository = async (id: number) => {
  const { data, error } = await db.from('usuarios').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') {
      // No se encontró el usuario
      return null;
    }
    throw error;
  }
  return data;
};

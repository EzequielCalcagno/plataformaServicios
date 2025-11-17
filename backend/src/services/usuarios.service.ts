import {
  getAllUsuariosRepository,
  getUsuarioByIdRepository,
} from '../repositories/usuarios.repository';

export const getAllUsuariosService = async () => {
  // acá podrías aplicar lógica de negocio en el futuro (ej: filtrar, transformar, etc.)
  const usuarios = await getAllUsuariosRepository();
  return usuarios;
};

export const getUsuarioByIdService = async (id: number) => {
  const usuario = await getUsuarioByIdRepository(id);
  return usuario;
};

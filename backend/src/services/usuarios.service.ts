import { getAllUsuariosRepository } from '../repositories/usuarios.repository.js';

export const getAllUsuariosService = async () => {
  // acá podrías aplicar lógica de negocio en el futuro (ej: filtrar, transformar, etc.)
  const usuarios = await getAllUsuariosRepository();
  return usuarios;
};

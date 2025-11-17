import { Request, Response } from 'express';
import { getAllUsuariosService, getUsuarioByIdService } from '../services/usuarios.service';

export const getAllUsuariosController = async (_req: Request, res: Response) => {
  try {
    const usuarios = await getAllUsuariosService();
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getCurrenteUserController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Asumiendo que el middleware de autenticación añade el usuario a la solicitud
    if (typeof userId !== 'number') {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }
    const usuario = await getUsuarioByIdService(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json(usuario);
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

import { Request, Response } from 'express';
import { getAllUsersService, getUserByIdService } from '../services/users.service';

export const getAllUsersController = async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsersService();
    return res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getCurrentUserController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Asumiendo que el middleware de autenticación añade el usuario a la solicitud
    if (typeof userId !== 'number') {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }
    const user = await getUserByIdService(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

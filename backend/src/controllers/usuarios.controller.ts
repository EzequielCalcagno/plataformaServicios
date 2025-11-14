import { Request, Response } from 'express';
import { getAllUsuariosService } from '../services/usuarios.service.js';

export const getAllUsuariosController = async (_req: Request, res: Response) => {
  try {
    const usuarios = await getAllUsuariosService();
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

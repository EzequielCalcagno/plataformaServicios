// src/controllers/profiles.controller.ts
import { Request, Response } from 'express';
import { getProfessionalProfileByUserIdService } from '../services/profiles.service';

export const getMyProfessionalProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (typeof userId !== 'number') {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const profile = await getProfessionalProfileByUserIdService(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Perfil profesional no encontrado' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('❌ Error en getMyProfessionalProfileController:', error);
    return res.status(500).json({ error: 'Error al obtener el perfil profesional' });
  }
};

// src/controllers/profiles.controller.ts
import { Request, Response } from 'express';
import {
  getProfessionalProfileByUserIdService,
  createMyProfessionalProfileService,
  updateMyProfessionalProfileService,
} from '../services/profiles.service';

// Obtener el perfil profesional del usuario autenticado
export const getMyProfessionalProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId || typeof userId !== 'string') {
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

// Actualizar perfil profesional del usuario autenticado
export const createMyProfessionalProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const profile = await createMyProfessionalProfileService(userId, req.body);

    return res.status(201).json(profile);
  } catch (error: any) {
    console.error('❌ Error en createMyProfessionalProfileController:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }

    if (error.message.includes('Ya tenés un perfil')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al crear el perfil profesional' });
  }
};

// Actualizar perfil profesional del usuario autenticado
export const updateMyProfessionalProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const updatedProfile = await updateMyProfessionalProfileService(userId, req.body);

    return res.status(200).json(updatedProfile);
  } catch (error: any) {
    console.error('❌ Error en updateMyProfessionalProfileController:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }

    return res.status(500).json({ error: 'Error al actualizar el perfil profesional' });
  }
};

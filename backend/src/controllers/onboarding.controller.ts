// src/controllers/onboarding.controller.ts
import { Request, Response } from 'express';
import {
  getProfessionalProfileByUserIdMaybeRepository,
  upsertProfessionalProfileRepository,
} from '../repositories/profiles.repository';

function getAuthUserId(req: Request): string {
  const u: any = (req as any).user;
  const id = u?.id || u?.userId || u?.sub;
  if (!id) throw new Error('Usuario no autenticado');
  return String(id);
}

export const getProOnboardingProfileController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);

    const pro = await getProfessionalProfileByUserIdMaybeRepository(userId);

    return res.json({
      especialidad: pro?.especialidad ?? '',
      descripcion: pro?.descripcion ?? '',
      experiencia: pro?.experiencia ?? '',
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Error interno' });
  }
};

export const upsertProOnboardingProfileController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);

    const { especialidad, descripcion, experiencia } = req.body ?? {};

    if (!String(especialidad || '').trim()) {
      return res.status(400).json({ message: 'especialidad es obligatoria' });
    }
    if (!String(descripcion || '').trim()) {
      return res.status(400).json({ message: 'descripcion es obligatoria' });
    }

    const saved = await upsertProfessionalProfileRepository({
      usuario_id: userId,
      especialidad: String(especialidad).trim(),
      descripcion: String(descripcion).trim(),
      experiencia: String(experiencia ?? descripcion).trim(),
      // si querés forzar fecha, tu tabla acepta fecha_actualizacion:
      // fecha_actualizacion: new Date().toISOString(),
    });

    return res.json({
      especialidad: saved?.especialidad ?? '',
      descripcion: saved?.descripcion ?? '',
      experiencia: saved?.experiencia ?? '',
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Error interno' });
  }
};

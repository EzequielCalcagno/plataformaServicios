// src/controllers/profiles.controller.ts
import { Request, Response } from 'express';
import {
  getProfessionalProfileByUserIdService,
  createMyProfessionalProfileService,
  updateMyProfessionalProfileService,
} from '../services/profiles.service';

import { getProfessionalProfileByUserIdRepository } from '../repositories/profiles.repository';
import { getProfessionalPublicProfileByUserIdService } from '../services/profiles.service';

// ================= EXISTENTE =================

// Obtener el perfil profesional del usuario autenticado
export const getMyProfessionalProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const authUser: any = (req as any).user;

    const userId = authUser?.id;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const profile = await getProfessionalProfileByUserIdService(userId);

    if (!profile) {
      return res
        .status(404)
        .json({ error: 'Perfil profesional no encontrado' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('❌ Error en getMyProfessionalProfileController:', error);
    return res
      .status(500)
      .json({ error: 'Error al obtener el perfil profesional' });
  }
};

// Crear perfil profesional del usuario autenticado
export const createMyProfessionalProfileController = async (
  req: Request,
  res: Response,
) => {
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
      return res
        .status(400)
        .json({ error: 'Datos inválidos', details: error.errors });
    }

    if (error.message.includes('Ya tenés un perfil')) {
      return res.status(409).json({ error: error.message });
    }

    return res
      .status(500)
      .json({ error: 'Error al crear el perfil profesional' });
  }
};

// Actualizar perfil profesional del usuario autenticado
export const updateMyProfessionalProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const updatedProfile = await updateMyProfessionalProfileService(
      userId,
      req.body,
    );

    return res.status(200).json(updatedProfile);
  } catch (error: any) {
    console.error('❌ Error en updateMyProfessionalProfileController:', error);

    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({ error: 'Datos inválidos', details: error.errors });
    }

    return res
      .status(500)
      .json({ error: 'Error al actualizar el perfil profesional' });
  }
};

/**
 * 🔹 Perfil compacto para la app (Home / MyAccount)
 */
export const getMyAppProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const authUser: any = (req as any).user;

    if (!authUser) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = String(authUser.id);

    const professionalRow = await getProfessionalProfileByUserIdRepository(
      userId,
    );

    const fullName =
      `${authUser.nombre ?? ''} ${authUser.apellido ?? ''}`.trim() ||
      authUser.nombre_completo ||
      authUser.email ||
      'Usuario';

    const rawRoleId = authUser.rolId ?? authUser.id_rol ?? 2;
    const roleId =
      typeof rawRoleId === 'string' ? Number(rawRoleId) : Number(rawRoleId);

    const photoUrl =
      (professionalRow as any)?.portadaUrl ??
      (professionalRow as any)?.portada_url ??
      authUser.foto_url ??
      authUser.avatar_url ??
      null;

    return res.json({
      roleId: roleId || 2,
      name: fullName,
      photoUrl,
      location: 'Montevideo, Uruguay',
      rating: 0,
      jobsCompleted: 0,
    });
  } catch (error) {
    console.error('❌ Error en getMyAppProfileController:', error);
    return res
      .status(500)
      .json({ message: 'Error al obtener el perfil para la app' });
  }
};

// ================= NUEVO (AGREGADO) =================

/**
 * 🔹 Obtener perfil profesional por ID (para Search → Ver perfil)
 * GET /api/v1/private/professionals/:userId
 */
export const getProfessionalProfileByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }

    const profile =
      await getProfessionalPublicProfileByUserIdService(userId);

    if (!profile) {
      return res
        .status(404)
        .json({ error: 'Perfil profesional no encontrado' });
    }

    return res.json(profile);
  } catch (error) {
    console.error(
      '❌ Error en getProfessionalProfileByIdController:',
      error,
    );
    return res
      .status(500)
      .json({ error: 'Error al obtener perfil profesional' });
  }
};
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
    const authUser: any = (req as any).user;

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

// 🔹 Perfil para la app móvil (cliente o profesional)
export const getMyAppProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const authUser: any = (req as any).user;

    if (!authUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log('👤 authUser en getMyAppProfileController:', authUser);

    // 👉 OJO: para la app usamos el id tal cual (puede ser 'p_00005', 'c_00001', etc.)
    const rawId = authUser.id ?? authUser.sub ?? null;

    if (!rawId) {
      console.error('⚠️ Token sin id/sub de usuario');
      return res
        .status(400)
        .json({ error: 'Token sin identificador de usuario' });
    }

    // No convertimos a número: puede ser string tipo 'p_00005'
    const userId: string | number = rawId;

    // Rol: sí suele ser numérico
    const rawRolId =
      authUser.rolId ??
      authUser.id_rol ??
      authUser.roleId ??
      authUser.role_id ??
      null;

    let rolId: number | undefined = undefined;
    if (rawRolId != null) {
      rolId =
        typeof rawRolId === 'number'
          ? rawRolId
          : Number(rawRolId);

      if (Number.isNaN(rolId)) {
        console.error('⚠️ rolId del token no es numérico:', rawRolId);
        rolId = undefined; // si querés, acá podrías devolver 400
      }
    }

    const profile = await getAppProfileByUserIdService(userId, rolId);

    return res.status(200).json(profile);
  } catch (e) {
    console.error('❌ Error en getMyAppProfileController:', e);
    return res
      .status(500)
      .json({ error: 'Error al obtener el perfil para la app' });
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

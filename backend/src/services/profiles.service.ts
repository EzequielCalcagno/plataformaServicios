// src/services/profiles.service.ts
import {
  getProfessionalProfileByUserIdRepository,
  upsertProfessionalProfileRepository,
} from '../repositories/profiles.repository';
import {
  ProfessionalProfileResponseSchema,
  UpdateProfessionalProfileSchema,
} from '../schemas/profile.schema';

export const getProfessionalProfileByUserIdService = async (userId: string) => {
  const raw = await getProfessionalProfileByUserIdRepository(userId);

  if (!raw) return null;

  const perfil = raw.perfil;
  const rolObj = raw.rol;

  const mapped = {
    id: raw.id,
    nombre: raw.nombre,
    apellido: raw.apellido,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    rol: Array.isArray(rolObj) && rolObj.length > 0 ? rolObj[0]?.nombre ?? null : null,
    profesional: Array.isArray(perfil) && perfil.length > 0
      ? {
          descripcion: perfil[0].descripcion,
          especialidad: perfil[0].especialidad,
          experiencia: perfil[0].experiencia,
          portadaUrl: perfil[0].portada_url,
          ratingPromedio: perfil[0].rating_promedio,
          fechaActualizacion: perfil[0].fecha_actualizacion
            ? new Date(perfil[0].fecha_actualizacion).toISOString()
            : null,
        }
      : null,
    ubicaciones: raw.ubicaciones ?? [],
  };

  return ProfessionalProfileResponseSchema.parse(mapped);
};

// Crear perfil profesional del usuario
export const createMyProfessionalProfileService = async (userId: string, payload: unknown) => {
  // 1) Validar body con Zod (mismo schema del update)
  const parsed = UpdateProfessionalProfileSchema.parse(payload);

  // 2) Verificar si YA existe
  const existing = await getProfessionalProfileByUserIdRepository(userId);

  if (existing?.perfil) {
    throw new Error('Ya tenés un perfil profesional creado');
  }

  // 3) Crear (upsert con solo crear)
  const dbPayload = {
    usuario_id: userId,
    descripcion: parsed.descripcion,
    especialidad: parsed.especialidad,
    experiencia: parsed.experiencia,
    portada_url: parsed.portadaUrl ?? null,
    fecha_actualizacion: new Date().toISOString(),
  };

  await upsertProfessionalProfileRepository(dbPayload);

  // 4) Retornar el perfil completo
  return getProfessionalProfileByUserIdService(userId);
};

// Editar / crear perfil profesional del usuario
export const updateMyProfessionalProfileService = async (userId: string, payload: unknown) => {
  // 1) Validamos body con Zod
  const parsed = UpdateProfessionalProfileSchema.parse(payload);

  // 2) Mapeamos nombres del schema -> columnas DB
  const dbPayload = {
    usuario_id: userId,
    descripcion: parsed.descripcion,
    especialidad: parsed.especialidad,
    experiencia: parsed.experiencia,
    portada_url: parsed.portadaUrl ?? null,
    fecha_actualizacion: new Date().toISOString(),
  };

  await upsertProfessionalProfileRepository(dbPayload);

  // 3) Devolvemos el perfil completo (igual que el GET /profile)
  return getProfessionalProfileByUserIdService(userId);
};

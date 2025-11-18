// src/services/profiles.service.ts
import { getProfessionalProfileByUserIdRepository } from '../repositories/profiles.repository';
import { ProfessionalProfileResponseSchema } from '../schemas/profile.schema';

export const getProfessionalProfileByUserIdService = async (userId: number) => {
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
    rol: rolObj?.nombre ?? null,
    profesional: perfil
      ? {
          descripcion: perfil.descripcion,
          especialidad: perfil.especialidad,
          experiencia: perfil.experiencia,
          portadaUrl: perfil.portada_url,
          ratingPromedio: perfil.rating_promedio,
          fechaActualizacion: perfil.fecha_actualizacion,
        }
      : null,
    ubicaciones: raw.ubicaciones ?? [],
  };

  // Validamos y retornamos el objeto mapeado
  return ProfessionalProfileResponseSchema.parse(mapped);
};

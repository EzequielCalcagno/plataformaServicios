// src/repositories/profiles.repository.ts
import db from '../config/db';

// Obtener el perfil profesional por ID de usuario
export const getProfessionalProfileByUserIdRepository = async (userId: string) => {
  const { data, error } = await db
    .from('perfiles_profesionales')
    .select(
      `
      id,
      usuario_id,
      descripcion,
      especialidad,
      experiencia,
      portada_url,
      rating_promedio,
      fecha_actualizacion
    `,
    )
    .eq('usuario_id', userId)
    .single();

  if (error) {
    console.error('❌ Error en getProfessionalProfileByUserIdRepository:', error);
    throw error;
  }

  return data || null;
};

type UpdateProfessionalProfileDbPayload = {
  usuario_id: string;
  descripcion?: string;
  especialidad?: string;
  experiencia?: string;
  portada_url?: string | null;
  fecha_actualizacion?: string;
};

// Crear o actualizar el perfil profesional
export const upsertProfessionalProfileRepository = async (
  payload: UpdateProfessionalProfileDbPayload,
) => {
  const { data, error } = await db
    .from('perfiles_profesionales')
    .upsert(payload, { onConflict: 'usuario_id' })
    .select(
      `
      id,
      usuario_id,
      descripcion,
      especialidad,
      experiencia,
      portada_url,
      rating_promedio,
      fecha_actualizacion
    `,
    )
    .single();

  if (error) {
    console.error('❌ Error en upsertProfessionalProfileRepository:', error);
    throw error;
  }

  return data;
};
export const getProfessionalPublicProfileByUserIdRepository = async (
  userId: string,
) => {
  const { data, error } = await db
    .from('perfiles_profesionales')
    .select(
      `
      usuario_id,
      descripcion,
      especialidad,
      experiencia,
      portada_url,
      rating_promedio
    `,
    )
    .eq('usuario_id', userId)
    .single();

  if (error) {
    console.error(
      '❌ Error en getProfessionalPublicProfileByUserIdRepository:',
      error,
    );
    return null;
  }

  return data;
};
// ✅ NUEVO: traer servicios activos del profesional (para perfil público)
export const getServicesByProfessionalIdRepository = async (
  profesionalId: string,
) => {
  const { data, error } = await db
    .from('servicios')
    .select(
      `
      id,
      profesional_id,
      titulo,
      categoria,
      descripcion,
      activo
    `,
    )
    .eq('profesional_id', profesionalId)
    .eq('activo', true)
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('❌ Error en getServicesByProfessionalIdRepository:', error);
    return [];
  }

  return data ?? [];
};
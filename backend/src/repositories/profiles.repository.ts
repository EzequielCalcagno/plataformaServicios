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

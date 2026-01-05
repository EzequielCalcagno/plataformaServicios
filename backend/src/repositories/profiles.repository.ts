// src/repositories/profiles.repository.ts
import db from '../config/db';

// Perfil profesional (privado)
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
  fecha_actualizacion?: string;
};

// Upsert perfil profesional (sin portada_url)
export const upsertProfessionalProfileRepository = async (payload: UpdateProfessionalProfileDbPayload) => {
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

// Perfil público (básico) - sin portada_url
export const getProfessionalPublicProfileByUserIdRepository = async (userId: string) => {
  const { data, error } = await db
    .from('perfiles_profesionales')
    .select(
      `
      usuario_id,
      descripcion,
      especialidad,
      experiencia,
      rating_promedio
    `,
    )
    .eq('usuario_id', userId)
    .single();

  if (error) {
    console.error('❌ Error en getProfessionalPublicProfileByUserIdRepository:', error);
    return null;
  }

  return data || null;
};

// Usuario base (para nombre/foto)
export const getUserBasicByIdRepository = async (userId: string) => {
  const { data, error } = await db
    .from('usuarios')
    .select(`id, nombre, apellido, foto_url`)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Error en getUserBasicByIdRepository:', error);
    return null;
  }

  return data || null;
};

// Servicios activos del profesional
export const getServicesByProfessionalIdRepository = async (profesionalId: string) => {
  const { data, error } = await db
    .from('servicios')
    .select(
      `
      id,
      profesional_id,
      titulo,
      categoria,
      descripcion,
      activo,
      creado_en
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

// ✅ rating summary (RPC)
export const getProfessionalRatingSummaryRepository = async (profesionalId: string) => {
  const { data, error } = await db.rpc('get_professional_rating_summary', {
    p_profesional_id: profesionalId,
  });

  if (error) {
    console.error('❌ Error en getProfessionalRatingSummaryRepository:', error);
    return null;
  }

  return Array.isArray(data) ? data[0] : data;
};

// ✅ reviews (RPC)
export const listProfessionalReviewsRepository = async (profesionalId: string, limit = 10, offset = 0) => {
  const { data, error } = await db.rpc('list_professional_reviews', {
    p_profesional_id: profesionalId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('❌ Error en listProfessionalReviewsRepository:', error);
    return [];
  }

  return data ?? [];
};

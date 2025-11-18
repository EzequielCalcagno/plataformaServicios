// src/repositories/profiles.repository.ts
import db from '../config/db';

export const getProfessionalProfileByUserIdRepository = async (userId: number) => {
  const { data, error } = await db
    .from('usuarios')
    .select(
      `
      id,
      nombre,
      apellido,
      email,
      avatar_url:foto_url,
      rol:roles (
        nombre
      ),
      perfil:perfiles_profesionales (
        descripcion,
        especialidad,
        experiencia,
        portada_url,
        rating_promedio,
        fecha_actualizacion
      ),
      ubicaciones (
        id,
        nombreUbicacion:nombre_ubicacion,
        ciudad,
        direccion,
        tipo,
        principal,
        activa
      )
    `,
    )
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Error en getProfessionalProfileByUserIdRepository:', error);
    throw error;
  }

  return data || null;
};

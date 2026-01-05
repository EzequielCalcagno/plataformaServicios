// src/services/profiles.service.ts
import {
  getProfessionalProfileByUserIdRepository,
  upsertProfessionalProfileRepository,
  getProfessionalPublicProfileByUserIdRepository,
  getServicesByProfessionalIdRepository,
  getUserBasicByIdRepository,
  getProfessionalRatingSummaryRepository,
  listProfessionalReviewsRepository,
} from '../repositories/profiles.repository';

import {
  ProfessionalProfileSchema,
  UpdateProfessionalProfileSchema,
} from '../schemas/profile.schema';

// Obtener perfil profesional (privado)
export const getProfessionalProfileByUserIdService = async (userId: string) => {
  const professional = await getProfessionalProfileByUserIdRepository(userId);
  if (!professional) return null;
  return ProfessionalProfileSchema.parse(professional);
};

// Crear perfil profesional
export const createMyProfessionalProfileService = async (userId: string, payload: unknown) => {
  const parsed = UpdateProfessionalProfileSchema.parse(payload);

  const existing = await getProfessionalProfileByUserIdRepository(userId);
  if (existing) throw new Error('Ya tenés un perfil profesional creado');

  const dbPayload = {
    usuario_id: userId,
    descripcion: parsed.descripcion,
    especialidad: parsed.especialidad,
    experiencia: parsed.experiencia,
    fecha_actualizacion: new Date().toISOString(),
  };

  await upsertProfessionalProfileRepository(dbPayload);
  return getProfessionalProfileByUserIdService(userId);
};

// Update perfil profesional
export const updateMyProfessionalProfileService = async (userId: string, payload: unknown) => {
  const parsed = UpdateProfessionalProfileSchema.parse(payload);

  const dbPayload = {
    usuario_id: userId,
    descripcion: parsed.descripcion,
    especialidad: parsed.especialidad,
    experiencia: parsed.experiencia,
    fecha_actualizacion: new Date().toISOString(),
  };

  await upsertProfessionalProfileRepository(dbPayload);
  return getProfessionalProfileByUserIdService(userId);
};

/**
 * ✅ Perfil para la APP (private/profile)
 * - devuelve datos del authUser + rating real + jobs real
 * - SIN portada_url
 */
export const getAppProfileByUserService = async (authUser: any) => {
  const userId = String(authUser.id);

  const fullName =
    `${authUser.nombre ?? ''} ${authUser.apellido ?? ''}`.trim() ||
    authUser.nombre_completo ||
    authUser.email ||
    'Usuario';

  const rawRoleId = authUser.rolId ?? authUser.id_rol ?? 2;
  const roleId = typeof rawRoleId === 'string' ? Number(rawRoleId) : Number(rawRoleId);

  // Intentamos leer perfil profesional (puede no existir)
  let professionalProfile: any = null;
  try {
    professionalProfile = await getProfessionalProfileByUserIdRepository(userId);
  } catch {}

  // rating real (si existe RPC)
  const ratingSummary = await getProfessionalRatingSummaryRepository(userId);

  // ✅ Foto: priorizamos foto del usuario (o avatar_url), NO portada_url
  const photoUrl = authUser.foto_url ?? authUser.avatar_url ?? null;

  return {
    roleId: roleId || 2,
    id: userId,
    name: fullName,
    photoUrl,
    // ✅ sin coverUrl
    coverUrl: null,
    location: 'Montevideo, Uruguay',
    professionalProfile: professionalProfile
      ? {
          descripcion: professionalProfile.descripcion ?? null,
          especialidad: professionalProfile.especialidad ?? null,
          experiencia: professionalProfile.experiencia ?? null,
        }
      : null,
    stats: {
      ratingAvg: Number(ratingSummary?.rating_avg ?? 0),
      reviewsCount: Number(ratingSummary?.reviews_count ?? 0),
      jobsCompleted: Number(ratingSummary?.jobs_completed ?? 0),
      starDist: ratingSummary?.star_dist ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    },
  };
};

/**
 * ✅ Perfil público del profesional (public/professionals/:id/profile)
 * - SIN portada_url
 */
export const getProfessionalPublicProfileByUserIdService = async (userId: string) => {
  const profile = await getProfessionalPublicProfileByUserIdRepository(userId);
  if (!profile) return null;

  const user = await getUserBasicByIdRepository(userId);
  const servicesDb = await getServicesByProfessionalIdRepository(userId);
  const ratingSummary = await getProfessionalRatingSummaryRepository(userId);
  const reviews = await listProfessionalReviewsRepository(userId, 10, 0);

  const name = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || 'Profesional';

  return {
    id: userId,
    name,
    photoUrl: user?.foto_url ?? null,
    // ✅ sin coverUrl
    coverUrl: null,

    specialty: profile.especialidad ?? null,
    location: 'Montevideo, Uruguay',
    about: profile.descripcion ?? null,

    services: (servicesDb ?? []).map((s: any) => ({
      id: String(s.id),
      title: String(s.titulo ?? ''),
      category: String(s.categoria ?? ''),
    })),

    stats: {
      ratingAvg: Number(ratingSummary?.rating_avg ?? 0),
      reviewsCount: Number(ratingSummary?.reviews_count ?? 0),
      jobsCompleted: Number(ratingSummary?.jobs_completed ?? 0),
      starDist: ratingSummary?.star_dist ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    },

    latestReviews: (reviews ?? []).map((r: any) => ({
      id: String(r.id),
      authorName: `${r.cliente_nombre ?? ''} ${r.cliente_apellido ?? ''}`.trim() || 'Usuario',
      timeAgo: r.created_at ? new Date(r.created_at).toISOString() : '',
      rating: Number(r.rating ?? 0),
      comment: r.comment ?? '',
      authorPhotoUrl: r.cliente_foto_url ?? null,
    })),
  };
};

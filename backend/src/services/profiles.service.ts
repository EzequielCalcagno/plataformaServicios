// src/services/profiles.service.ts
import {
  getProfessionalProfileByUserIdRepository,
  upsertProfessionalProfileRepository,
} from '../repositories/profiles.repository';
import {
  ProfessionalProfileSchema,
  UpdateProfessionalProfileSchema,
} from '../schemas/profile.schema';
import { getProfessionalPublicProfileByUserIdRepository } from '../repositories/profiles.repository';
import { getServicesByProfessionalIdRepository } from '../repositories/profiles.repository';


// Obtener el perfil profesional por ID de usuario
export const getProfessionalProfileByUserIdService = async (userId: string) => {
  const professional = await getProfessionalProfileByUserIdRepository(userId);

  if (!professional) return null;

  return ProfessionalProfileSchema.parse(professional);
};

//__________________CAMBIOS ELIAS _______________________________

// Crear perfil profesional del usuario
export const createMyProfessionalProfileService = async (
  userId: string,
  payload: unknown,
) => {
  // 1) Validar body con Zod (mismo schema del update)
  const parsed = UpdateProfessionalProfileSchema.parse(payload);

  // 2) Verificar si YA existe
  const existing = await getProfessionalProfileByUserIdRepository(userId);

  if (existing) {
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
export const updateMyProfessionalProfileService = async (
  userId: string,
  payload: unknown,
) => {
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

/**
 * 🔹 Servicio específico para la APP (Home / MyAccount)
 * Usa:
 *  - datos básicos del usuario (req.user)
 *  - perfil profesional (perfiles_profesionales) para obtener portadaUrl
 */
export const getAppProfileByUserService = async (authUser: any) => {
  const userId = String(authUser.id);

  // Intentamos leer el perfil profesional (puede no existir aún)
  let professionalProfile: any = null;
  try {
    professionalProfile = await getProfessionalProfileByUserIdService(userId);
  } catch (e) {
    console.error(
      '⚠️ Error leyendo perfil profesional en getAppProfileByUserService:',
      e,
    );
  }

  const fullName =
    `${authUser.nombre ?? ''} ${authUser.apellido ?? ''}`.trim() ||
    authUser.nombre_completo ||
    authUser.email ||
    'Usuario';

  const rawRoleId = authUser.rolId ?? authUser.id_rol ?? 2;
  const roleId =
    typeof rawRoleId === 'string' ? Number(rawRoleId) : Number(rawRoleId);

  // 👇 PRIORIDAD de la foto:
  // 1) portadaUrl del perfil profesional
  // 2) foto_url / avatar_url del usuario
  const photoUrl =
    professionalProfile?.portadaUrl ??
    authUser.foto_url ??
    authUser.avatar_url ??
    null;

  return {
    roleId: roleId || 2,
    name: fullName,
    photoUrl, // 👈 ESTA es la que usa MyAccount
    location: 'Montevideo, Uruguay', // placeholder por ahora
    rating: 0, // placeholder
    jobsCompleted: 0, // placeholder
  };
  
};
export const getProfessionalPublicProfileByUserIdService = async (
  userId: string,
) => {
  const profile = await getProfessionalPublicProfileByUserIdRepository(userId);

  if (!profile) return null;

  // ✅ Traer servicios reales
  const servicesDb = await getServicesByProfessionalIdRepository(userId);

  // ✅ DEBUG útil (backend)
  console.log('🧩 Public profile userId:', userId);
  console.log('🧩 servicesDb count:', servicesDb?.length ?? 0);

  return {
    id: userId, // 👈 CLAVE: ESTE ES EL ID QUE FALTABA
    name: 'Profesional', // después podés unir con usuarios si querés
    photoUrl: profile.portada_url ?? null,
    specialty: profile.especialidad ?? null,
    location: 'Montevideo, Uruguay', // placeholder
    rating: profile.rating_promedio ?? 0,
    jobsCompleted: 0,
    positiveFeedback: null,
    about: profile.descripcion ?? null,

    // ✅ ahora sí devuelve servicios
    services: (servicesDb ?? []).map((s: any) => ({
      id: String(s.id),
      title: String(s.titulo ?? ''),
      category: String(s.categoria ?? ''),
    })),

    reviews: [], // luego lo sumamos
  };
};
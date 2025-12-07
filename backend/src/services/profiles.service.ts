// src/services/profiles.service.ts
import {
  getProfessionalProfileByUserIdRepository,
  upsertProfessionalProfileRepository,
} from '../repositories/profiles.repository';
import {
  ProfessionalProfileResponseSchema,
  UpdateProfessionalProfileSchema,
} from '../schemas/profile.schema';
import { ROLES } from '../constants/roles';

type RawRolItem = {
  nombre: string;
};

type RawPerfilProfesional = {
  descripcion: string | null;
  especialidad: string | null;
  experiencia: string | null;
  portada_url: string | null;
  rating_promedio: number | null;
  fecha_actualizacion: string | null;
};

type RawProfessionalProfileRow = {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  avatar_url: string | null;
  // 👇 el repo devuelve arrays
  rol: RawRolItem[] | null;
  perfil: RawPerfilProfesional[] | null;
  ubicaciones?: any[];
};

// 🔹 Servicio que ya usás para el perfil profesional “web”
export const getProfessionalProfileByUserIdService = async (userId: string) => {
  const rawResponse = await getProfessionalProfileByUserIdRepository(userId);

  if (!rawResponse) return null;

  const raw = rawResponse as unknown as RawProfessionalProfileRow;

  const perfil = raw.perfil && raw.perfil.length > 0 ? raw.perfil[0] : null;

  let rolNombre: string | null = null;
  if (raw.rol && raw.rol.length > 0) {
    rolNombre = raw.rol[0].nombre;
  }

  const mapped = {
    id: raw.id,
    nombre: raw.nombre,
    apellido: raw.apellido,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    rol: Array.isArray(rolNombre) && rolNombre.length > 0 ? (rolNombre[0]?.nombre ?? null) : null,
    profesional:
      Array.isArray(perfil) && perfil.length > 0
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

//__________________CAMBIOS ELIAS _______________________________

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

// // 🔹 Servicio específico para la APP (shape que espera Profile.tsx / Home.tsx)
// export const getAppProfileByUserIdService = async (
//   userId: string | number,
//   rolId?: number,
// ) => {
//   // 👉 PARA LA APP: el id puede ser 'p_00005', 'c_00001', etc.
//   // Lo usamos tal cual viene.
//   const { data: user, error } = await db
//     .from('usuarios')
//     .select('*')
//     .eq('id', userId) // 👈 sin Number()
//     .maybeSingle();

//   if (error) {
//     console.error('❌ Error en getAppProfileByUserIdService (DB):', error);
//     throw error;
//   }

//   if (!user) {
//     console.error(
//       '❌ Usuario no encontrado en getAppProfileByUserIdService, id=',
//       userId,
//     );
//     throw new Error('Usuario no encontrado');
//   }

//   // avatar puede tener distintos nombres según el esquema
//   const avatar =
//     (user as any).avatar_url ??
//     (user as any).foto_url ??
//     null;

//   // Normalizamos el rol: viene del token (rolId) o de la tabla usuarios.id_rol
//   const rawRol =
//     typeof rolId === 'number' && !Number.isNaN(rolId)
//       ? rolId
//       : (user as any).id_rol;

//   const effectiveRolId: number =
//     typeof rawRol === 'string' ? Number(rawRol) : rawRol;

//   const isProfessional = effectiveRolId === ROLES.PROFESIONAL.id;
//   const fullName = `${user.nombre} ${user.apellido ?? ''}`.trim();

//   // 2) Profesional → shape ProfessionalProfile (lo que espera el front móvil)
//   if (isProfessional) {
//     return {
//       roleId: effectiveRolId, // 👈 IMPORTANTE: lo mandamos al front
//       photoUrl:
//         avatar ?? 'https://picsum.photos/seed/default-professional/200',
//       name: fullName || 'Profesional',
//       specialty: 'Servicios generales', // luego podés sacarlo de perfiles_profesionales
//       location: 'Montevideo, Uruguay', // luego de ubicaciones
//       rating: 0,
//       jobsCompleted: 0,
//       positiveFeedback: 0,
//       about:
//         'Aún no hay información cargada sobre este profesional. Podés actualizarla desde Edit Profile.',
//       photos: [] as { id: string; url: string }[],
//       ratingSummary: {
//         totalReviews: 0,
//         distribution: [
//           { stars: 5, percent: 0 },
//           { stars: 4, percent: 0 },
//           { stars: 3, percent: 0 },
//           { stars: 2, percent: 0 },
//           { stars: 1, percent: 0 },
//         ],
//       },
//       reviews: [] as {
//         id: string;
//         clientName: string;
//         timeAgo: string;
//         rating: number;
//         comment: string;
//         likes: number;
//         replies: number;
//       }[],
//     };
//   }

//   // 3) Cliente → shape ClientProfile
//   return {
//     roleId: effectiveRolId, // 👈 también para cliente
//     photoUrl:
//       avatar ?? 'https://picsum.photos/seed/default-client/200',
//     name: fullName || 'Cliente',
//     location: 'Montevideo, Uruguay',
//     email: user.email,
//     phone: user.telefono ?? '',
//     pendingRequests: [] as {
//       id: string;
//       serviceType: string;
//       professionalName: string;
//       status: string;
//       createdAt: string;
//     }[],
//     completedWorks: [] as {
//       id: string;
//       title: string;
//       description: string;
//       professionalName: string;
//       date: string;
//     }[],
//   };
// };

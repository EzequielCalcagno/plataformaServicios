// src/services/profile.client.ts
import { api } from '../utils/api';

export type ProfileResponse = {
  roleId: number;
  photoUrl?: string | null;
  name: string;
  location?: string | null;
  rating?: number | null;
  jobsCompleted?: number | null;
};

export type UpdateProfessionalProfilePayload = {
  especialidad: string;
  descripcion: string;
  experiencia?: string; 
};

export type ProfessionalProfileResponse = {
  especialidad?: string | null;
  descripcion?: string | null;
  experiencia?: string | null;
};

/*Perfil profesional "completo" del usuario autenticado*/
export async function getMyProfessionalProfile() {
  return await api.get<any>('/private/profile');
}

/* Perfil compacto para la app (Home / MyAccount) — sirve para cualquier rol.*/
export async function getMyAppProfile() {
  return await api.get<ProfileResponse>('/private/app/me');
}


export async function getMyProfile() {
  return await api.get<any>('/private/profile');
}

export type ProfessionalPublicProfileResponse = {
  id: string;
  photoUrl?: string | null;
  name: string;
  specialty?: string | null;
  location?: string | null;
  rating?: number | null;
  jobsCompleted?: number | null;
  positiveFeedback?: number | null;
  about?: string | null;

  // Opcional: si tu backend devuelve servicios/reviews, quedan tipados.
  services?: { id: string; title: string; category: string }[];
  reviews?: {
    id: string;
    clientName: string;
    timeAgo: string;
    rating: number;
    comment: string;
    likes: number;
    replies: number;
  }[];
};

/* Perfil público/visible de un profesional (para “Ver perfil” desde Search)*/
export async function getProfessionalProfileById(profesionalId: string) {
  if (!profesionalId) {
    throw new Error('profesionalId es requerido');
  }

  return await api.get<ProfessionalPublicProfileResponse>(
    `/private/profile/${encodeURIComponent(profesionalId)}`,
  );
}

export async function getProfessionalProfileByUserId(userId: string) {
  return getProfessionalProfileById(userId);
}

export async function updateProfessionalProfile(payload: UpdateProfessionalProfilePayload) {
  if (!payload?.especialidad?.trim()) {
    throw new Error('La especialidad es obligatoria.');
  }
  if (!payload?.descripcion?.trim()) {
    throw new Error('La descripción es obligatoria.');
  }

  // backend: PATCH /private/profile
  return await api.patchJson<ProfessionalProfileResponse>('/private/profile', {
    especialidad: payload.especialidad.trim(),
    descripcion: payload.descripcion.trim(),
    experiencia: (payload.experiencia ?? payload.descripcion).trim(),
  });
}

export async function getProOnboardingProfile() {
  return await api.get<ProfessionalProfileResponse>('/private/pro-onboarding/profile');
}

export async function updateProOnboardingProfile(payload: UpdateProfessionalProfilePayload) {
  if (!payload?.especialidad?.trim()) throw new Error('La especialidad es obligatoria.');
  if (!payload?.descripcion?.trim()) throw new Error('La descripción es obligatoria.');

  return await api.patchJson<ProfessionalProfileResponse>('/private/pro-onboarding/profile', {
    especialidad: payload.especialidad.trim(),
    descripcion: payload.descripcion.trim(),
    experiencia: (payload.experiencia ?? payload.descripcion).trim(),
  });
}

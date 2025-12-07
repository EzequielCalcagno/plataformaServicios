// src/services/profile.client.ts
import { api } from '../utils/api';

export type ProfileResponse = {
  roleId: number;
  photoUrl?: string;
  name: string;
  location?: string;
  rating?: number;
  jobsCompleted?: number;
};

export async function getMyProfile() {
  // El token lo agrega http automáticamente
  const data = await api.get<ProfileResponse>('/private/profile');
  return data;
}
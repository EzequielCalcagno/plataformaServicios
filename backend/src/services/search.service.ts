// src/services/search.service.ts
import { searchServiciosRepository } from '../repositories/search.repository';
import type { User } from '../schemas/user.schema';

export const searchServiciosService = async (input: {
  lat: number;
  lng: number;
  q?: string;
  radiusKm?: number;
  limit?: number;
  offset?: number;
}) => {
  const data = await searchServiciosRepository(input);
  return data;
};

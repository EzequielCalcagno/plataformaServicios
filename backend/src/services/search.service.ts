// src/services/search.service.ts
import { searchServiciosRepository } from '../repositories/search.repository';

export const searchServiciosService = async (input: {
  lat: number;
  lng: number;
  q?: string;
  radiusKm?: number;
  limit?: number;
  offset?: number;
}) => {
  // si querés después: validar con Zod (schema)
  return searchServiciosRepository(input);
};

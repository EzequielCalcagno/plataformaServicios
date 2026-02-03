// src/repositories/search.repository.ts
import db from '../config/db';

export type SearchServiciosParams = {
  lat: number;
  lng: number;
  q?: string;
  radiusKm?: number;
  limit?: number;
  offset?: number;
};

export const searchServiciosRepository = async (params: SearchServiciosParams) => {
  const {
    lat,
    lng,
    q = '',
    radiusKm = 10,
    limit = 50,
    offset = 0,
  } = params;

  const { data, error } = await db.rpc('search_servicios', {
    p_lat: lat,
    p_lng: lng,
    p_query: q,
    p_radius_km: radiusKm,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('❌ Error en searchServiciosRepository:', error);
    throw error;
  }

  return data ?? [];
};
export const getUsersBasicByIdsRepository = async (ids: string[]) => {
  if (!ids.length) return [];

  const { data, error } = await db
    .from('usuarios')
    .select('id, nombre, apellido, foto_url')
    .in('id', ids);

  if (error) {
    console.error('❌ Error en getUsersBasicByIdsRepository:', error);
    throw error;
  }

  return data ?? [];
};
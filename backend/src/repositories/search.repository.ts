import db from '../config/db';

export type SearchServiciosParams = {
  lat: number;
  lng: number;
  q?: string;
  radiusKm?: number;
  limit?: number;
  offset?: number;

  category?: string | null;
  requesterId?: string | null;
  workedWith?: boolean;
};

export const searchServiciosRepository = async (params: SearchServiciosParams) => {
  const {
    lat,
    lng,
    q = '',
    radiusKm = 10,
    limit = 50,
    offset = 0,

    category = null,
    requesterId = null,
    workedWith = false,
  } = params;

  const { data, error } = await db.rpc('search_servicios', {
    p_lat: lat,
    p_lng: lng,
    p_query: q,
    p_radius_km: radiusKm,
    p_limit: limit,
    p_offset: offset,
    p_category: category,
    p_requester_id: requesterId,
    p_worked_with: workedWith,
  });

  if (error) {
    console.error('❌ Error en searchServiciosRepository:', error);
    throw error;
  }

  return data ?? [];
};

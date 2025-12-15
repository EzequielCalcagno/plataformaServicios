// src/repositories/locations.repository.ts
import db from '../config/db';

export type LocationRow = {
  id: number;
  usuario_id: string;
  nombre_ubicacion: string | null;
  ciudad: string | null;
  direccion: string | null;
  coordenadas: any; // PostGIS Geometry Point
  tipo: string;
  principal: boolean;
  activa: boolean;
  fecha_registro: string;
  lat?: number | null;
  lng?: number | null;
};

type LocationPayload = {
  usuario_id: string;
  nombre_ubicacion?: string;
  ciudad?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  tipo?: string;
  principal?: boolean;
  activa?: boolean;
};

const BASE_SELECT =
  'id,usuario_id,nombre_ubicacion,ciudad,direccion,tipo,principal,activa,fecha_registro,coordenadas,lat,lng';

// Listar ubicaciones activas del usuario
export async function getLocationsByUserIdRepository(userId: string): Promise<LocationRow[]> {
  const { data, error } = await db
    .from('ubicaciones')
    .select(BASE_SELECT as any) // 👈 importante
    .eq('usuario_id', userId)
    .eq('activa', true)
    .order('principal', { ascending: false });

  if (error) {
    console.error('❌ Error getLocationsByUserIdRepository:', error);
    throw error;
  }

  return (data as any as LocationRow[]) || [];
}

// Obtener una ubicación concreta (validando que sea del user)
export async function getLocationByIdRepository(
  userId: string,
  id: number,
): Promise<LocationRow | null> {
  const { data, error } = await db
    .from('ubicaciones')
    .select(BASE_SELECT as any)
    .eq('usuario_id', userId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error getLocationByIdRepository:', error);
    throw error;
  }

  return (data as any as LocationRow) || null;
}

// Crear ubicación
export async function createLocationRepository(payload: LocationPayload): Promise<LocationRow> {
  const { lat, lng, ...rest } = payload;

  const insertObj: any = {
    ...rest,
  };

  if (lat != null && lng != null) {
    insertObj.coordenadas = `SRID=4326;POINT(${lng} ${lat})`;
  }

  const { data, error } = await db
    .from('ubicaciones')
    .insert(insertObj)
    .select(BASE_SELECT as any) // 👈
    .single();

  if (error) {
    console.error('❌ Error createLocationRepository:', error);
    throw error;
  }

  return data as any as LocationRow;
}

// Actualizar ubicación
export async function updateLocationRepository(
  userId: string,
  id: number,
  payload: LocationPayload,
): Promise<LocationRow> {
  const { lat, lng, ...rest } = payload;

  const updateObj: any = { ...rest };

  if (lat != null && lng != null) {
    updateObj.coordenadas = `SRID=4326;POINT(${lng} ${lat})`;
  }

  const { data, error } = await db
    .from('ubicaciones')
    .update(updateObj)
    .eq('usuario_id', userId)
    .eq('id', id)
    .select(BASE_SELECT as any) // 👈
    .single();

  if (error) {
    console.error('❌ Error updateLocationRepository:', error);
    throw error;
  }

  return data as any as LocationRow;
}

// Contar cuántas ubicaciones fijas activas tiene el user
export async function countActiveFixedLocationsRepository(userId: string): Promise<number> {
  const { count, error } = await db
    .from('ubicaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', userId)
    .eq('tipo', 'fija')
    .eq('activa', true);

  if (error) {
    console.error('❌ Error countActiveFixedLocationsRepository:', error);
    throw error;
  }

  return count ?? 0;
}

// Setear principal=false al resto
export async function unsetOtherPrincipalLocationsRepository(userId: string) {
  const { error } = await db
    .from('ubicaciones')
    .update({ principal: false })
    .eq('usuario_id', userId)
    .eq('principal', true);

  if (error) {
    console.error('❌ Error unsetOtherPrincipalLocationsRepository:', error);
    throw error;
  }
}

// Eliminar (soft delete)
export async function softDeleteLocationRepository(userId: string, id: number): Promise<void> {
  const { error } = await db
    .from('ubicaciones')
    .update({ activa: false, principal: false })
    .eq('usuario_id', userId)
    .eq('id', id);

  if (error) {
    console.error('❌ Error softDeleteLocationRepository:', error);
    throw error;
  }
}

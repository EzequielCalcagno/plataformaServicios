// src/repositories/locations.repository.ts
import db from '../config/db';

export type LocationRow = {
  id: number;
  usuario_id: string;
  nombre_ubicacion: string | null;
  ciudad: string | null;
  direccion: string | null;
  coordenadas: any | null; 
  tipo: string | null;
  principal: boolean;
  activa: boolean;
  fecha_registro: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type CreateLocationDbPayload = {
  usuario_id: string;
  nombre_ubicacion?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  coordenadas?: any | null; 
  tipo?: string | null;
  principal?: boolean;
  activa?: boolean;
};

export type UpdateLocationDbPayload = Partial<{
  nombre_ubicacion: string | null;
  ciudad: string | null;
  direccion: string | null;
  coordenadas: any | null; 
  tipo: string | null;
  principal: boolean;
  activa: boolean;
}>;

const SELECT_FIELDS = `
  id,
  usuario_id,
  nombre_ubicacion,
  ciudad,
  direccion,
  coordenadas,
  tipo,
  principal,
  activa,
  fecha_registro,
  lat,
  lng
`;

export async function listLocationsByUserRepository(userId: string) {
  const { data, error } = await db
    .from('ubicaciones')
    .select(SELECT_FIELDS)
    .eq('usuario_id', userId)
    .order('principal', { ascending: false })
    .order('fecha_registro', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LocationRow[];
}


export async function getLocationByIdForUserRepository(userId: string, id: number) {
  const { data, error } = await db
    .from('ubicaciones')
    .select(SELECT_FIELDS)
    .eq('id', id)
    .eq('usuario_id', userId)
    .single();

  if (error) return null;
  return (data ?? null) as LocationRow | null;
}

export async function createLocationRepository(payload: CreateLocationDbPayload) {
  const { data, error } = await db
    .from('ubicaciones')
    .insert({
      usuario_id: payload.usuario_id,
      nombre_ubicacion: payload.nombre_ubicacion ?? null,
      ciudad: payload.ciudad ?? null,
      direccion: payload.direccion ?? null,


      coordenadas: payload.coordenadas ?? null,

      tipo: payload.tipo ?? null,
      principal: payload.principal ?? false,
      activa: payload.activa ?? true,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) throw error;
  return data as LocationRow;
}

export async function updateLocationForUserRepository(
  userId: string,
  id: number,
  patch: UpdateLocationDbPayload,
) {
  const { data, error } = await db
    .from('ubicaciones')
    .update({
      ...patch,
    })
    .eq('id', id)
    .eq('usuario_id', userId)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw error;
  return data as LocationRow;
}

export async function deleteLocationForUserRepository(userId: string, id: number) {
  const { error } = await db
    .from('ubicaciones')
    .delete()
    .eq('id', id)
    .eq('usuario_id', userId);

  if (error) throw error;
  return true;
}


export async function clearPrincipalForUserRepository(userId: string) {
  const { error } = await db
    .from('ubicaciones')
    .update({ principal: false })
    .eq('usuario_id', userId)
    .eq('principal', true);

  if (error) throw error;
  return true;
}

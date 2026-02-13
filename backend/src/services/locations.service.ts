// src/services/locations.service.ts
import {
  listLocationsByUserRepository,
  getLocationByIdForUserRepository,
  deleteLocationForUserRepository,
  createLocationRepository,
  updateLocationForUserRepository,
  
  clearPrincipalForUserRepository,
} from '../repositories/locations.repository';

type GeoPoint = { type: 'Point'; coordinates: [number, number] };

function geoPointToEWKT(p?: GeoPoint | null): string | null {
  if (!p) return null;
  if (p.type !== 'Point') return null;
  const [lng, lat] = p.coordinates ?? [];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return `SRID=4326;POINT(${lng} ${lat})`;
}

function toLocationDto(row: any) {
  return {
    id: Number(row.id),
    usuario_id: row.usuario_id ?? null,
    nombre_ubicacion: row.nombre_ubicacion ?? null,
    ciudad: row.ciudad ?? null,
    direccion: row.direccion ?? null,
    coordenadas: row.coordenadas ?? null,
    tipo: row.tipo ?? null,
    activa: row.activa ?? null,
    fecha_registro: row.fecha_registro ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    principal: !!row.principal,
  };
}

export async function listMyLocationsService(userId: string) {
  const rows = await listLocationsByUserRepository(userId);
  return rows.map(toLocationDto);
}



export async function updateMyLocationService(userId: string, locationId: number, payload: any) {
  if (payload?.principal === true) {
    await clearPrincipalForUserRepository(userId);
  }

  const ewkt =
    payload?.coordenadas != null ? geoPointToEWKT(payload.coordenadas) : undefined;

  const updated = await updateLocationForUserRepository(userId, locationId, {
    nombre_ubicacion: payload?.nombre_ubicacion ?? undefined,
    ciudad: payload?.ciudad ?? undefined,
    direccion: payload?.direccion ?? undefined,
    coordenadas: ewkt,

    tipo: payload?.tipo ?? undefined,
    activa: typeof payload?.activa === 'boolean' ? payload.activa : undefined,
    principal: typeof payload?.principal === 'boolean' ? payload.principal : undefined,
  });

  return toLocationDto(updated);
}

export async function deleteMyLocationService(userId: string, locationId: number) {
  const exists = await getLocationByIdForUserRepository(userId, locationId);
  if (!exists) throw new Error('Ubicación no encontrada');

  await deleteLocationForUserRepository(userId, locationId);
  return true;
}
export async function createMyLocationService(userId: string, payload: any) {
  const makePrincipal = !!payload?.principal;
  if (makePrincipal) {
    await clearPrincipalForUserRepository(userId);
  }
  const ewkt =
    payload?.coordenadas?.type === 'Point'
      ? `SRID=4326;POINT(${payload.coordenadas.coordinates[0]} ${payload.coordenadas.coordinates[1]})`
      : null;

  const created = await createLocationRepository({
    usuario_id: userId,
    nombre_ubicacion: payload?.nombre_ubicacion ?? null,
    ciudad: payload?.ciudad ?? null,
    direccion: payload?.direccion ?? null,
    coordenadas: ewkt,
    tipo: payload?.tipo ?? null,
    principal: makePrincipal,
    activa: true,
  });

  return {
    id: Number(created.id),
    usuario_id: created.usuario_id,
    nombre_ubicacion: created.nombre_ubicacion,
    ciudad: created.ciudad,
    direccion: created.direccion,
    lat: created.lat ?? null,
    lng: created.lng ?? null,
    principal: !!created.principal,
  };
}

// src/services/locations.client.ts
import { api } from '../utils/api';

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
};

export type LocationDto = {
  id: number;

  // owner (en general no lo necesitás en FE, pero lo dejamos opcional)
  usuario_id?: string;

  nombre_ubicacion: string | null;
  ciudad: string | null;
  direccion: string | null;

  // DB fields / compat
  coordenadas?: GeoPoint | null;
  tipo?: string | null;
  activa?: boolean;
  fecha_registro?: string | null;

  // ✅ GENERATED ALWAYS (solo lectura, pero la API puede devolverlas)
  lat: number | null;
  lng: number | null;

  principal: boolean;
};

// ---------- Payloads ----------
// Permitimos null en UI, pero lo limpiamos antes de mandar.
export type CreateLocationPayload = {
  nombre_ubicacion?: string | null;
  ciudad?: string | null;
  direccion?: string | null;

  // Podés mandar una u otra:
  // - lat/lng (lo convierte backend a coordenadas)
  // - coordenadas (GeoJSON) directo
  lat?: number | null;
  lng?: number | null;
  coordenadas?: GeoPoint | null;

  principal?: boolean | null;
  tipo?: string | null;
  activa?: boolean | null;
};

export type UpdateLocationPayload = Partial<CreateLocationPayload>;

// helpers
function toGeoPoint(lng: number, lat: number): GeoPoint {
  return { type: 'Point', coordinates: [lng, lat] };
}

function buildBody(payload: CreateLocationPayload | UpdateLocationPayload) {
  const body: any = {};

  // strings: si viene null o '' => no mandamos (o podés mandar null si preferís)
  if (typeof payload.nombre_ubicacion === 'string') body.nombre_ubicacion = payload.nombre_ubicacion;
  if (payload.nombre_ubicacion === null) body.nombre_ubicacion = null;

  if (typeof payload.ciudad === 'string') body.ciudad = payload.ciudad;
  if (payload.ciudad === null) body.ciudad = null;

  if (typeof payload.direccion === 'string') body.direccion = payload.direccion;
  if (payload.direccion === null) body.direccion = null;

  // flags
  if (typeof payload.principal === 'boolean') body.principal = payload.principal;
  if (typeof payload.activa === 'boolean') body.activa = payload.activa;

  // opcionales
  if (typeof payload.tipo === 'string') body.tipo = payload.tipo;
  if (payload.tipo === null) body.tipo = null;

  /**
   * ✅ Coordenadas:
   * - Si viene payload.coordenadas => mandamos coordenadas
   * - Sino, si vienen lat/lng numéricos => mandamos lat/lng (backend lo convierte)
   *
   * Importante:
   * - como en tu DB lat/lng son GENERATED, NO conviene que el backend intente insertarlos.
   *   Pero el FE sí puede mandarlos, porque el backend los convertirá a "coordenadas".
   */
  if (payload.coordenadas && payload.coordenadas.type === 'Point') {
    body.coordenadas = payload.coordenadas;
  } else {
    const lat = typeof payload.lat === 'number' ? payload.lat : null;
    const lng = typeof payload.lng === 'number' ? payload.lng : null;

    if (lat != null && lng != null) {
      // Podés mandar lat/lng o mandar coordenadas directamente.
      // Yo prefiero mandar coordenadas, así el backend no depende de lat/lng.
      body.coordenadas = toGeoPoint(lng, lat);
      // Si preferís mandar lat/lng, reemplazá por:
      // body.lat = lat;
      // body.lng = lng;
    }
  }

  return body;
}

// GET /private/locations
export async function getMyLocations(): Promise<LocationDto[]> {
  const data = await api.get<LocationDto[]>('/private/locations');
  return data ?? [];
}

// POST /private/locations
export async function createLocation(payload: CreateLocationPayload): Promise<LocationDto> {
  const body = buildBody(payload);
  const data = await api.post<LocationDto>('/private/locations', { body });
  return data;
}

// PATCH /private/locations/:id
export async function updateLocation(id: number, payload: UpdateLocationPayload): Promise<LocationDto> {
  const body = buildBody(payload);
  const data = await api.patch<LocationDto>(`/private/locations/${id}`, { body });
  return data;
}

// DELETE /private/locations/:id
export async function deleteLocation(id: number): Promise<void> {
  await api.delete(`/private/locations/${id}`);
}

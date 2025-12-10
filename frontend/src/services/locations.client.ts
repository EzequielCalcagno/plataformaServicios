// src/services/locations.client.ts
import { api } from '../utils/api';

export type LocationDto = {
  id: number;
  usuario_id: string;
  nombre_ubicacion: string | null;
  ciudad: string | null;
  direccion: string | null;
  coordenadas: any;
  tipo: string;
  principal: boolean;
  activa: boolean;
  fecha_registro: string;
};

// GET /private/locations
export async function getMyLocations(): Promise<LocationDto[]> {
  const data = await api.get<LocationDto[]>('/private/locations');
  return data;
}

export async function createLocation(payload: {
  nombre_ubicacion?: string;
  ciudad?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  principal?: boolean;
}): Promise<LocationDto> {
  const data = await api.post<LocationDto>('/private/locations', {
    body: payload,
  });
  return data;
}

// PATCH /private/locations/:id  (ej: marcar como principal)
export async function updateLocation(
  id: number,
  payload: Partial<{
    nombre_ubicacion: string;
    ciudad: string;
    direccion: string;
    lat: number;
    lng: number;
    principal: boolean;
  }>,
): Promise<LocationDto> {
  const data = await api.patch<LocationDto>(`/private/locations/${id}`, {
    ...(payload as any),
  });
  return data;
}

// DELETE /private/locations/:id
export async function deleteLocation(id: number): Promise<void> {
  await api.delete(`/private/locations/${id}`);
}

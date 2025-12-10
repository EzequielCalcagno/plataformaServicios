// src/services/locations.service.ts
import {
  getLocationsByUserIdRepository,
  getLocationByIdRepository,
  countActiveFixedLocationsRepository,
  unsetOtherPrincipalLocationsRepository,
  createLocationRepository,
  updateLocationRepository,
  softDeleteLocationRepository,
} from '../repositories/locations.repository';

export async function getMyLocationsService(userId: string) {
  return getLocationsByUserIdRepository(userId);
}

export async function getMyLocationByIdService(userId: string, id: number) {
  const loc = await getLocationByIdRepository(userId, id);
  if (!loc) {
    throw new Error('Ubicación no encontrada');
  }
  return loc;
}

type CreateLocationInput = {
  nombreUbicacion?: string;
  ciudad?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  principal?: boolean;
};

export async function createMyLocationService(userId: string, input: CreateLocationInput) {
  const count = await countActiveFixedLocationsRepository(userId);
  if (count >= 2) {
    throw new Error('Solo podés tener hasta 2 ubicaciones fijas');
  }

  if (input.principal) {
    await unsetOtherPrincipalLocationsRepository(userId);
  }

  return createLocationRepository({
    usuario_id: userId,
    nombre_ubicacion: input.nombreUbicacion,
    ciudad: input.ciudad,
    direccion: input.direccion,
    lat: input.lat,
    lng: input.lng,
    tipo: 'fija',
    principal: !!input.principal,
    activa: true,
  });
}

export async function updateMyLocationService(
  userId: string,
  id: number,
  input: CreateLocationInput,
) {
  if (input.principal) {
    await unsetOtherPrincipalLocationsRepository(userId);
  }

  return updateLocationRepository(userId, id, {
    usuario_id: userId,
    nombre_ubicacion: input.nombreUbicacion,
    ciudad: input.ciudad,
    direccion: input.direccion,
    lat: input.lat,
    lng: input.lng,
    principal: input.principal,
  });
}

export async function deleteMyLocationService(userId: string, id: number) {
  await softDeleteLocationRepository(userId, id);
}

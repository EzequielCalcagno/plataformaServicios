import {
  upsertProLiveLocationRepository,
  disableProLiveLocationRepository,
} from '../repositories/proLiveLocation.repository';

export async function upsertMyProLiveLocationService(userId: string, payload: any) {
  const enabled = payload?.enabled === true;

  const lat = typeof payload?.lat === 'number' ? payload.lat : null;
  const lng = typeof payload?.lng === 'number' ? payload.lng : null;

  // Si enabled true, idealmente debe venir lat/lng
  // pero no rompemos: si no viene, igual marcamos enabled (no recomendado)
  return upsertProLiveLocationRepository({
    userId,
    enabled,
    lat,
    lng,
  });
}

export async function disableMyProLiveLocationService(userId: string) {
  return disableProLiveLocationRepository(userId);
}

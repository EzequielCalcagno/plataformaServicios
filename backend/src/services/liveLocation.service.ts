import { upsertLiveLocationRepository, disableLiveLocationRepository } from '../repositories/liveLocation.repository';

export async function upsertLiveLocationService(userId: string, lat: number, lng: number) {
  // EWKT para geography
  const ewkt = `SRID=4326;POINT(${lng} ${lat})`;
  return upsertLiveLocationRepository(userId, ewkt);
}

export async function disableLiveLocationService(userId: string) {
  return disableLiveLocationRepository(userId);
}

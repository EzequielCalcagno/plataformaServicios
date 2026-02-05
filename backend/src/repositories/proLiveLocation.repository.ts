import db from '../config/db';

export async function upsertProLiveLocationRepository(input: {
  userId: string;
  enabled: boolean;
  lat?: number | null;
  lng?: number | null;
}) {
  const { userId, enabled, lat, lng } = input;

  // Si no hay coords, guardamos enabled/updated_at y dejamos coordenadas como null (o no tocarlas).
  const coordenadas =
    typeof lat === 'number' && typeof lng === 'number'
      ? `SRID=4326;POINT(${lng} ${lat})`
      : null;

  // Nota: postgrest/supabase acepta geography como EWKT string en insert/update
  const payload: any = {
    user_id: userId,
    enabled,
    updated_at: new Date().toISOString(),
  };

  // Solo seteamos coordenadas si vienen
  if (coordenadas) payload.coordenadas = coordenadas;

  const { data, error } = await db
    .from('pro_live_locations')
    .upsert(payload, { onConflict: 'user_id' })
    .select('user_id, enabled, updated_at, lat, lng')
    .single();

  if (error) {
    console.error('❌ Error en upsertProLiveLocationRepository:', error);
    throw error;
  }

  return data;
}

export async function disableProLiveLocationRepository(userId: string) {
  const { data, error } = await db
    .from('pro_live_locations')
    .upsert(
      {
        user_id: userId,
        enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('user_id, enabled, updated_at, lat, lng')
    .single();

  if (error) {
    console.error('❌ Error en disableProLiveLocationRepository:', error);
    throw error;
  }

  return data;
}

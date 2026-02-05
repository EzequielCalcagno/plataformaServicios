import db from '../config/db';

const SELECT_FIELDS = `user_id, enabled, updated_at, lat, lng`;

export async function upsertLiveLocationRepository(userId: string, ewkt: string) {
  const { data, error } = await db
    .from('pro_live_locations')
    .upsert(
      {
        user_id: userId,
        coordenadas: ewkt,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select(SELECT_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function disableLiveLocationRepository(userId: string) {
  const { error } = await db
    .from('pro_live_locations')
    .upsert(
      {
        user_id: userId,
        enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;
  return true;
}

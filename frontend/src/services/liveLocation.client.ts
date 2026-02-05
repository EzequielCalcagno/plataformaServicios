import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL =
  ((Constants.expoConfig?.extra as any)?.API_URL as string)?.replace(/\/+$/, '') || '';

const TOKEN_KEY = '@token';

export async function pushLiveLocation(lat: number, lng: number) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return;

  const res = await fetch(`${API_URL}/private/live-location`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lat, lng }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'pushLiveLocation failed');
  }
}

export async function disableLiveLocation() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return;

  await fetch(`${API_URL}/private/live-location`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

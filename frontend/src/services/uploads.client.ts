// src/services/uploads.client.ts
import { api } from '../utils/api';

export async function uploadProfileImage(asset: { uri: string; type?: string; name?: string }) {
  const fd = new FormData();
  fd.append('image', {
    uri: asset.uri,
    type: asset.type ?? 'image/jpeg',
    name: asset.name ?? 'avatar.jpg',
  } as any);

  return await api.post<{ url: string }>('/private/uploads/profile-image', {
    body: fd,
  });
}

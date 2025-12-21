// src/repositories/storage.repository.ts
import supabase from '../config/db';

export const uploadToBucket = async (
  params: {
    bucket: string;
    path: string;
    buffer: Buffer;
    contentType: string;
    upsert: boolean;
  }
): Promise<string> => {
    const { bucket, path, buffer, contentType, upsert } = params;

    const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
      cacheControl: '3600',
      upsert,
      contentType,
    });

    if (error || !data) {
      console.error('❌ Error subiendo a Supabase Storage:', error);
      throw new Error('No se pudo subir la imagen');
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error('No se pudo obtener URL pública');
    }

    return publicUrlData.publicUrl;
  }

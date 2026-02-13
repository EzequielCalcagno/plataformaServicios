// src/services/uploads.service.ts
import fs from 'fs/promises';
import path from 'path';
import { uploadToBucket } from '../repositories/storage.repository';
import { updateUserPhotoUrlRepository } from '../repositories/users.repository';

type UploadInput = {
  file: Express.Multer.File;
  userId: string;
};

export async function uploadWorkImageService({ file, userId }: UploadInput): Promise<string> {
  const bucket = process.env.SUPABASE_BUCKET || 'pds-files';

  const ext = getExtension(file.originalname) ?? 'jpg';
  const fileName = `works/${userId}/${Date.now()}.${ext}`;

  return uploadAndCleanup({
    bucket,
    file,
    fileName,
    upsert: false,
  });
}

export async function uploadProfileImageService({ file, userId }: UploadInput): Promise<string> {
  const bucket = process.env.SUPABASE_BUCKET || 'pds-files';

  const ext = getExtension(file.originalname) ?? 'jpg';
 // pisa el avatar anterior
  const fileName = `profiles/${userId}/avatar.${ext}`;

  // se sube y se obtenemos URL pública
  const publicUrl = await uploadAndCleanup({
    bucket,
    file,
    fileName,
    upsert: true,
  });

  // se guarda la URL en la tabla usuarios.foto_url

  await updateUserPhotoUrlRepository(userId, publicUrl);

  return publicUrl;
}


// Helpers

async function uploadAndCleanup(params: {
  bucket: string;
  file: Express.Multer.File;
  fileName: string;
  upsert: boolean;
}): Promise<string> {
  const { bucket, file, fileName, upsert } = params;

  try {
    const buffer = await fs.readFile(file.path);

    const publicUrl = await uploadToBucket({
      bucket,
      path: fileName,
      buffer,
      contentType: file.mimetype,
      upsert,
    });

    return publicUrl;
  } finally {

    try {
      await fs.unlink(file.path);
    } catch {
    }
  }
}

function getExtension(originalName: string): string | null {
  const ext = path.extname(originalName).replace('.', '').trim().toLowerCase();
  return ext ? ext : null;
}

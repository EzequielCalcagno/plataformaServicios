// src/services/uploads.service.ts
import fs from 'fs/promises';
import path from 'path';
import { uploadToBucket } from '../repositories/storage.repository';

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
  // siempre pisa el avatar
  const fileName = `profiles/${userId}/avatar.${ext}`;

  return uploadAndCleanup({
    bucket,
    file,
    fileName,
    upsert: true,
  });
}

// -------------------------
// Helpers
// -------------------------
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
    // borra el temp file de multer (siempre)
    try {
      await fs.unlink(file.path);
    } catch {
      // no pasa nada si ya no existe
    }
  }
}

function getExtension(originalName: string): string | null {
  const ext = path.extname(originalName).replace('.', '').trim().toLowerCase();
  return ext ? ext : null;
}

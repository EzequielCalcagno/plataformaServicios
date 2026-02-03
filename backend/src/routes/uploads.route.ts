// src/routes/uploads.route.ts
import { Router, Request, Response } from 'express';
import fs from 'fs';
import supabase from '../config/db';
import { uploadImage } from '../uploads/imageUpload';
import { requireAuth } from '../middlewares/requireAuth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { updateUserPhotoUrlService } from '../services/users.service';

type MulterRequest = Request & {
  file?: Express.Multer.File;
  user?: { id?: string | number };
};

const router = Router();

/**
 * SUBIR IMAGEN DE TRABAJO (PROFESIONAL)
 * POST /api/v1/uploads/work-image
 */
router.post(
  '/uploads/work-image',
  requireAuth,
  requireRole('PROFESIONAL'),
  uploadImage.single('image'),
  async (req: Request, res: Response) => {
    try {
      const mReq = req as MulterRequest;

      if (!mReq.file) return res.status(400).json({ message: 'No se recibió archivo' });

      const fileBuffer = fs.readFileSync(mReq.file.path);

      const bucket = process.env.SUPABASE_BUCKET || 'pds-files';
      const userId = String(mReq.user?.id ?? 'anon');

      const ext = mReq.file.originalname.split('.').pop() || 'jpg';
      const fileName = `works/${userId}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: mReq.file.mimetype,
      });

      if (error || !data) {
        console.error('❌ Error subiendo WORK:', error);
        return res.status(500).json({ message: 'No se pudo subir imagen' });
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return res.json({ url: publicUrlData.publicUrl });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Error interno' });
    }
  },
);

/**
 * SUBIR FOTO DE PERFIL (cliente o profesional)
 * POST /api/v1/uploads/profile-image
 */
router.post(
  '/uploads/profile-image',
  requireAuth,
  uploadImage.single('image'),
  async (req: Request, res: Response) => {
    try {
      const mReq = req as MulterRequest;

      if (!mReq.file) return res.status(400).json({ message: 'No se recibió archivo' });

      const fileBuffer = fs.readFileSync(mReq.file.path);

      const bucket = process.env.SUPABASE_BUCKET || 'pds-files';
      const userId = String(mReq.user?.id ?? 'anon');

      const ext = mReq.file.originalname.split('.').pop() || 'jpg';
      const fileName = `profiles/${userId}/avatar.${ext}`;

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, fileBuffer, {
        contentType: mReq.file.mimetype,
        cacheControl: '3600',
        upsert: true,
      });

      if (error || !data) {
        console.error('❌ Error subiendo a Supabase Storage (profile):', error);
        return res.status(500).json({ message: 'No se pudo subir la imagen de perfil a Supabase' });
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      const publicUrl = publicUrlData.publicUrl;

      const finalUrl = `${publicUrl}?v=${Date.now()}`;

      // ✅ guardar en BD
      await updateUserPhotoUrlService(userId, finalUrl);

      console.log('✅ Imagen PROFILE subida + guardada en DB:', data.path, '->', finalUrl);

      return res.json({ url: finalUrl });
    } catch (e) {
      console.error('❌ Error en /uploads/profile-image', e);
      return res.status(500).json({ message: 'Error interno al subir imagen de perfil' });
    }
  },
);

export default router;

// src/routes/workUploads.ts
import { Router, Request, Response } from 'express';
import { uploadWorkImage } from '../uploads/workImageUpload';
import { requireAuth } from '../middlewares/requireAuth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';

// 👇 Tipo local, simple, para que TypeScript sepa que existe req.file
type MulterRequest = Request & {
  file?: any;
};

const router = Router();

/**
 * POST /api/v1/uploads/work-image
 * Body: multipart/form-data con campo "image"
 */
router.post(
  '/uploads/work-image',
  requireAuth,
  requireRole("PROFESIONAL"),
  uploadWorkImage.single('image'),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió archivo' });
    }

    const baseUrl = process.env.API_PUBLIC_URL || 'http://192.168.1.8:3000';
    const publicUrl = `${baseUrl}/uploads/${req.file.filename}`;

    console.log('✅ Imagen subida:', req.file.filename, '->', publicUrl);

    return res.json({ url: publicUrl });
  },
);
export default router;

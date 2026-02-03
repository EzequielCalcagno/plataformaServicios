// src/controllers/uploads.controller.ts
import { Request, Response } from 'express';
import { uploadProfileImageService, uploadWorkImageService } from '../services/uploads.service';
import { updateUserPhotoUrlRepository } from '../repositories/users.repository';

type MulterRequest = Request & {
  file?: Express.Multer.File;
  user?: { id?: string | number };
};

export const uploadWorkImageController = async (req: Request, res: Response) => {
  try {
    const mReq = req as MulterRequest;

    if (!mReq.file) {
      return res.status(400).json({ message: 'No se recibió archivo' });
    }

    const userId = String(mReq.user?.id ?? 'anon');

    const url = await uploadWorkImageService({
      file: mReq.file,
      userId,
    });

    return res.json({ url });
  } catch (e) {
    console.error('❌ uploadWorkImage controller:', e);
    return res.status(500).json({ message: 'Error interno' });
  }
};

export const uploadProfileImageController = async (req: Request, res: Response) => {
  try {
    const mReq = req as MulterRequest;

    if (!mReq.file) {
      return res.status(400).json({ message: 'No se recibió archivo' });
    }

    const userId = String(mReq.user?.id ?? '');
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // 1) Subir a Storage y obtener URL pública
    const url = await uploadProfileImageService({
      file: mReq.file,
      userId,
    });

    // 2) ✅ Guardar la URL en la tabla usuarios.foto_url
    await updateUserPhotoUrlRepository(userId, url);

    return res.json({ url });
  } catch (e) {
    console.error('❌ uploadProfileImage controller:', e);
    return res.status(500).json({ message: 'Error_toggle al subir imagen de perfil' });
  }
};

import { Request, Response } from 'express';
import { upsertLiveLocationService, disableLiveLocationService } from '../services/liveLocation.service';

function getUserId(req: any) {
  const userId = String(req.user?.id ?? '');
  if (!userId) throw new Error('No autenticado');
  return userId;
}

export const upsertLiveLocationController = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);

    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'lat y lng son obligatorios y numéricos' });
    }

    const saved = await upsertLiveLocationService(userId, lat, lng);
    return res.json(saved);
  } catch (e: any) {
    console.error('❌ upsertLiveLocationController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
};

export const disableLiveLocationController = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);
    await disableLiveLocationService(userId);
    return res.status(204).send();
  } catch (e: any) {
    console.error('❌ disableLiveLocationController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
};

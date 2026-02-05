import { Request, Response } from 'express';
import {
  upsertMyProLiveLocationService,
  disableMyProLiveLocationService,
} from '../services/proLiveLocation.service';

function getUserId(req: any) {
  const userId = String(req.user?.id ?? '');
  if (!userId) throw new Error('No autenticado');
  return userId;
}

// PATCH /private/pro-live-location
export async function upsertMyProLiveLocationController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const result = await upsertMyProLiveLocationService(userId, req.body);
    return res.json(result);
  } catch (e: any) {
    console.error('❌ upsertMyProLiveLocationController:', JSON.stringify(e, null, 2));
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

// DELETE /private/pro-live-location
export async function disableMyProLiveLocationController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const result = await disableMyProLiveLocationService(userId);
    return res.json(result);
  } catch (e: any) {
    console.error('❌ disableMyProLiveLocationController:', JSON.stringify(e, null, 2));
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

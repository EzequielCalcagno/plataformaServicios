// src/controllers/locations.controller.ts
import { Request, Response } from 'express';
import {
  listMyLocationsService,
  createMyLocationService,
  updateMyLocationService,
  deleteMyLocationService,
} from '../services/locations.service';

function getUserId(req: any) {
  const userId = String(req.user?.id ?? '');
  if (!userId) throw new Error('No autenticado');
  return userId;
}

export async function getMyLocationsController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const data = await listMyLocationsService(userId);
    return res.json(data);
  } catch (e: any) {
    console.error('❌ getMyLocationsController:', JSON.stringify(e, null, 2));
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

export async function createMyLocationController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const created = await createMyLocationService(userId, req.body);
    return res.status(201).json(created);
  } catch (e: any) {
    console.error('❌ createMyLocationController:', JSON.stringify(e, null, 2));
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

export async function updateMyLocationController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'id inválido' });

    const updated = await updateMyLocationService(userId, id, req.body);
    return res.json(updated);
  } catch (e: any) {
    console.error('❌ updateMyLocationController:', JSON.stringify(e, null, 2));
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

export async function deleteMyLocationController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'id inválido' });

    await deleteMyLocationService(userId, id);
    return res.status(204).send();
  } catch (e: any) {
    console.error('❌ deleteMyLocationController:', JSON.stringify(e, null, 2));
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

// src/controllers/locations.controller.ts
import { Request, Response } from 'express';
import {
  getMyLocationsService,
  getMyLocationByIdService,
  createMyLocationService,
  updateMyLocationService,
  deleteMyLocationService,
} from '../services/locations.service';

export async function getMyLocationsController(req: Request, res: Response) {
  try {
    const userId = req.user!.id; // asumimos que requireAuth setea req.user
    const locations = await getMyLocationsService(userId);
    return res.json(locations);
  } catch (err) {
    console.error('❌ Error getMyLocationsController:', err);
    return res.status(500).json({ message: 'Error al obtener ubicaciones' });
  }
}

export async function getLocationByIdController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const location = await getMyLocationByIdService(userId, id);
    return res.json(location);
  } catch (err: any) {
    console.error('❌ Error getLocationByIdController:', err);
    if (err.message === 'Ubicación no encontrada') {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Error al obtener ubicación' });
  }
}

export async function createMyLocationController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const loc = await createMyLocationService(userId, req.body);
    return res.status(201).json(loc);
  } catch (err: any) {
    console.error('❌ Error createMyLocationController:', err);
    if (err.message?.includes('hasta 2 ubicaciones')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Error al crear ubicación' });
  }
}

export async function updateMyLocationController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const loc = await updateMyLocationService(userId, id, req.body);
    return res.json(loc);
  } catch (err) {
    console.error('❌ Error updateMyLocationController:', err);
    return res.status(500).json({ message: 'Error al actualizar ubicación' });
  }
}

export async function deleteMyLocationController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    await deleteMyLocationService(userId, id);
    return res.status(204).send();
  } catch (err) {
    console.error('❌ Error deleteMyLocationController:', err);
    return res.status(500).json({ message: 'Error al eliminar ubicación' });
  }
}

import { Request, Response } from 'express';
import { searchServiciosService } from '../services/search.service';

export const searchServiciosController = async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    const q = String(req.query.q ?? '');
    const category = req.query.category ? String(req.query.category) : null;

    const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : 10;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const workedWith = String(req.query.workedWith ?? '') === '1';

    const requesterId = (req as any).user?.id ? String((req as any).user.id) : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'lat y lng son obligatorios y numéricos' });
    }

    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      return res.status(400).json({ message: 'radiusKm inválido' });
    }

    const results = await searchServiciosService({
      lat,
      lng,
      q,
      radiusKm,
      limit,
      offset,
      category,
      workedWith,
      requesterId,
    });

    return res.json({ results });
  } catch (error) {
    console.error('❌ Error en searchServiciosController:', error);
    return res.status(500).json({ message: 'Error interno al buscar servicios' });
  }
};

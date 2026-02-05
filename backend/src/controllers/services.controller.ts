// src/controllers/services.controller.ts
import { Request, Response } from 'express';
import {
  listMyServicesService,
  createMyServiceService,
  updateMyServiceService,
  deleteMyServiceService,
  getServiceSuggestionsService,
  bootstrapMyServicesService,
} from '../services/services.service';

function getUserId(req: any) {
  const userId = String(req.user?.id ?? '');
  if (!userId) throw new Error('No autenticado');
  return userId;
}

export async function listMyServicesController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const data = await listMyServicesService(userId);
    return res.json(data);
  } catch (e: any) {
    console.error('❌ listMyServicesController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

export async function createMyServiceController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const created = await createMyServiceService(userId, req.body);
    return res.status(201).json(created);
  } catch (e: any) {
    console.error('❌ createMyServiceController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

export async function updateMyServiceController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'id inválido' });

    const updated = await updateMyServiceService(userId, id, req.body);
    return res.json(updated);
  } catch (e: any) {
    console.error('❌ updateMyServiceController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

export async function deleteMyServiceController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'id inválido' });

    await deleteMyServiceService(userId, id);
    return res.status(204).send();
  } catch (e: any) {
    console.error('❌ deleteMyServiceController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

/**
 * ✅ Sugerencias por categoría (para el front)
 * GET /private/services/suggestions?category=Plomería&q=insta&limit=30
 */
export async function getServiceSuggestionsController(req: Request, res: Response) {
  try {
    const category = String(req.query.category ?? '').trim();
    const q = String(req.query.q ?? '').trim();
    const limit = req.query.limit ? Number(req.query.limit) : 30;

    if (!category) {
      return res.status(400).json({ message: 'category es requerido' });
    }

    const suggestions = await getServiceSuggestionsService({
      category,
      q,
      limit: Number.isFinite(limit) ? limit : 30,
    });

    return res.json({ category, suggestions });
  } catch (e: any) {
    console.error('❌ getServiceSuggestionsController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

/**
 * ✅ Precargar varios servicios típicos al profesional
 * POST /private/services/bootstrap
 * body: { category?: string, titles?: string[], max?: number, priceBase?: number|null }
 */
export async function bootstrapMyServicesController(req: Request, res: Response) {
  try {
    const userId = getUserId(req as any);

    const category = req.body?.category != null ? String(req.body.category).trim() : null;
    const titlesRaw = Array.isArray(req.body?.titles) ? req.body.titles : null;
    const max = req.body?.max != null ? Number(req.body.max) : 8;
    const priceBase = req.body?.priceBase != null ? Number(req.body.priceBase) : null;

    const titles =
      titlesRaw?.map((t: any) => String(t ?? '').trim()).filter((t: string) => !!t) ?? null;

    const created = await bootstrapMyServicesService(userId, {
      category,
      titles,
      max: Number.isFinite(max) ? max : 8,
      priceBase: Number.isFinite(priceBase as any) ? priceBase : null,
    });

    return res.status(201).json({ createdCount: created.length, created });
  } catch (e: any) {
    console.error('❌ bootstrapMyServicesController:', e);
    return res.status(500).json({ message: e?.message ?? 'Error interno' });
  }
}

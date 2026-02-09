import { Request, Response } from 'express';
import db from '../config/db';

function getAuthUserId(req: Request): string {
  const u: any = (req as any).user;
  const id = u?.id || u?.userId || u?.sub;
  if (!id) throw new Error('Usuario no autenticado');
  return String(id);
}

export const listMyOnboardingServicesController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);

    const { data, error } = await db
      .from('servicios')
      .select('id, profesional_id, titulo, descripcion, categoria, activo, creado_en, precio_base')
      .eq('profesional_id', userId)
      .order('creado_en', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });
    return res.json(data ?? []);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Error interno' });
  }
};

export const createMyOnboardingServiceController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);

    const { titulo, descripcion, categoria, precio_base } = req.body ?? {};
    if (!String(titulo || '').trim())
      return res.status(400).json({ message: 'titulo es obligatorio' });
    if (!String(categoria || '').trim())
      return res.status(400).json({ message: 'categoria es obligatoria' });

    // ✅ clave: activo=false en onboarding
    const payload = {
      profesional_id: userId,
      titulo: String(titulo).trim(),
      descripcion: descripcion ? String(descripcion).trim() : null,
      categoria: String(categoria).trim(),
      precio_base: precio_base == null ? null : Number(precio_base),
      activo: false,
    };

    const { data, error } = await db.from('servicios').insert(payload).select('*').single();

    if (error) return res.status(500).json({ message: error.message });
    return res.status(201).json(data);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Error interno' });
  }
};

export const updateMyOnboardingServiceController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const id = Number(req.params.id);

    const { titulo, descripcion, categoria, precio_base, activo } = req.body ?? {};
    // activo lo podés ignorar en onboarding o permitirlo (yo lo ignoraría)
    const patch: any = {};
    if (titulo != null) patch.titulo = String(titulo).trim();
    if (descripcion !== undefined)
      patch.descripcion = descripcion ? String(descripcion).trim() : null;
    if (categoria != null) patch.categoria = String(categoria).trim();
    if (precio_base !== undefined)
      patch.precio_base = precio_base === '' || precio_base == null ? null : Number(precio_base);

    const { data, error } = await db
      .from('servicios')
      .update(patch)
      .eq('id', id)
      .eq('profesional_id', userId)
      .select('*')
      .single();

    if (error) return res.status(500).json({ message: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Error interno' });
  }
};

export const deleteMyOnboardingServiceController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const id = Number(req.params.id);

    const { error } = await db.from('servicios').delete().eq('id', id).eq('profesional_id', userId);

    if (error) return res.status(500).json({ message: error.message });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Error interno' });
  }
};

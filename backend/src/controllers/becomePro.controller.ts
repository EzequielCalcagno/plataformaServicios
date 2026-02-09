// src/controllers/becomePro.controller.ts
import { Request, Response } from 'express';
import db from '../config/db';

function getAuthUserId(req: Request): string {
  const u: any = (req as any).user;
  const id = u?.id || u?.userId || u?.sub;
  if (!id) throw new Error('Usuario no autenticado');
  return String(id);
}

export const activateBecomeProController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);

    const { data: pro, error: proErr } = await db
      .from('perfiles_profesionales')
      .select('usuario_id, especialidad, descripcion')
      .eq('usuario_id', userId)
      .maybeSingle();

    if (proErr) return res.status(500).json({ message: proErr.message });
    if (!pro || !String(pro.especialidad || '').trim() || !String(pro.descripcion || '').trim()) {
      return res
        .status(400)
        .json({ message: 'Completá tu perfil profesional antes de activarte.' });
    }

    // activar drafts del usuario
    await db.from('servicios').update({ activo: true }).eq('profesional_id', userId);

    const { data: services, error: srvErr } = await db
      .from('servicios')
      .select('id, activo')
      .eq('profesional_id', userId)
      .limit(1);

    if (srvErr) return res.status(500).json({ message: srvErr.message });
    if (!services || services.length === 0) {
      return res.status(400).json({ message: 'Publicá al menos un servicio para activarte.' });
    }

    const { data: updated, error: upErr } = await db
      .from('usuarios')
      .update({ id_rol: 2 })
      .eq('id', userId)
      .select('id, id_rol, email, nombre, apellido, foto_url')
      .single();

    if (upErr) return res.status(500).json({ message: upErr.message });

    await db.from('servicios').update({ activo: true }).eq('profesional_id', userId);

    return res.json({ ok: true, user: updated });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Error interno' });
  }
};

// src/routes/works.route.ts
import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * POST /v1/works
 * Crea un nuevo trabajo / servicio realizado por un profesional.
 * Body esperado:
 *  {
 *    "title": "Cambio de grifería",
 *    "description": "Reemplazo completo y sellado",
 *    "date": "2025-11-09",       // opcional
 *    "imageUrls": ["https://..."] // opcional
 *  }
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const rol = req.user!.rol;

    if (rol !== 2) {
      return res
        .status(403)
        .json({ error: 'Solo los profesionales pueden crear trabajos.' });
    }

    const { title, description, date, imageUrls } = req.body as {
      title?: string;
      description?: string;
      date?: string;
      imageUrls?: string[];
    };

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: 'title y description son obligatorios.' });
    }

    const fecha = date && date.trim() !== '' ? date : null;

    // Insertar trabajo
    const workResult = await pool.query(
      `INSERT INTO trabajos (profesional_id, titulo, descripcion, fecha)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, title, description, fecha]
    );

    const trabajoId = workResult.rows[0].id as number;

    // Insertar imágenes (opcional)
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      const values: any[] = [];
      const chunks: string[] = [];

      imageUrls.forEach((url, idx) => {
        const baseIndex = idx * 3;
        values.push(trabajoId, url, idx + 1); // orden = idx+1
        chunks.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
      });

      await pool.query(
        `INSERT INTO trabajo_imagenes (trabajo_id, url, orden)
         VALUES ${chunks.join(', ')}`,
        values
      );
    }

    return res.status(201).json({ id: trabajoId });
  } catch (e) {
    console.error('POST /v1/works ERROR', e);
    return res
      .status(500)
      .json({ error: 'Error en servidor al crear trabajo.' });
  }
});

export default router;

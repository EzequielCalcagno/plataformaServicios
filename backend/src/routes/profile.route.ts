// src/routes/profile.route.ts
import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /v1/profiles/me
 * Si el usuario es profesional (rol = 2) → devuelve ProfessionalProfile
 * Si es cliente (rol = 1) → devuelve ClientProfile sencillo
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const rol = req.user!.rol;

    // 🟦 PROFESIONAL
    if (rol === 2) {
      const prof = await pool.query(
        `SELECT u.id, u.nombre, u.apellido, u.foto_url,
                pp.especialidad, pp.descripcion,
                COALESCE(v.rating_promedio, 0)::float AS rating_promedio,
                COALESCE(v.total_resenas, 0)::int   AS total_resenas
           FROM usuarios u
           LEFT JOIN perfiles_profesionales pp ON pp.usuario_id = u.id
           LEFT JOIN v_profesional_rating v    ON v.profesional_id = u.id
          WHERE u.id = $1`,
        [id]
      );
      if (prof.rowCount === 0) {
        return res.status(404).json({ error: 'Profesional no encontrado' });
      }
      const p = prof.rows[0];

      // Fotos
      const fotosResult = await pool.query(
        `SELECT ti.url
           FROM trabajos t
           JOIN trabajo_imagenes ti ON ti.trabajo_id = t.id
          WHERE t.profesional_id = $1
          ORDER BY t.created_at DESC, ti.orden ASC
          LIMIT 6`,
        [id]
      );

      // Trabajos completados (cantidad)
      const jobsResult = await pool.query(
        `SELECT COUNT(*)::int AS jobs_completed
           FROM trabajos
          WHERE profesional_id = $1`,
        [id]
      );
      const jobsCompleted: number = jobsResult.rows[0]?.jobs_completed || 0;

      // Reseñas
      const resenasResult = await pool.query(
        `SELECT r.rating, r.comentario, r.created_at,
                uc.nombre || ' ' || COALESCE(uc.apellido,'') AS cliente_nombre,
                uc.foto_url AS cliente_foto
           FROM resenas r
           JOIN usuarios uc ON uc.id = r.cliente_id
          WHERE r.profesional_id = $1
          ORDER BY r.created_at DESC
          LIMIT 50`,
        [id]
      );

      const resenas = resenasResult.rows;

      // Distribución de estrellas (5..1)
      const totalReviews = p.total_resenas || resenas.length;
      const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      for (const r of resenas) {
        const stars = Math.max(1, Math.min(5, Math.round(Number(r.rating))));
        counts[stars] = (counts[stars] || 0) + 1;
      }
      const baseForPercent = totalReviews || 1;
      const distribution = [5, 4, 3, 2, 1].map((star) => {
        const count = counts[star] || 0;
        const percent = Math.round((count * 100) / baseForPercent);
        return { stars: star, percent };
      });

      // Positive feedback: % de reseñas con rating >= 4
      const goodReviews = Object.entries(counts)
        .filter(([s]) => Number(s) >= 4)
        .reduce((acc, [, c]) => acc + c, 0);
      const positiveFeedback =
        totalReviews === 0 ? 0 : Math.round((goodReviews * 100) / baseForPercent);

      // Mapeo fotos → {id,url}
      const photos = fotosResult.rows.map((f, idx) => ({
        id: String(idx + 1),
        url: f.url as string,
      }));

      // Mapeo reseñas → formato que espera el front
      const reviews = resenas.map((r, idx) => ({
        id: String(idx + 1),
        clientName: r.cliente_nombre as string,
        timeAgo: (r.created_at as Date).toISOString().substring(0, 10),
        rating: Number(r.rating),
        comment: r.comentario as string,
        likes: 0,
        replies: 0,
      }));

      // ⭐ OBJETO FINAL ProfessionalProfile
      const professionalProfile = {
        photoUrl: p.foto_url as string,
        name: `${p.nombre} ${p.apellido}`,
        specialty: (p.especialidad as string) || 'Servicios',
        location: 'Montevideo, Uruguay', // TODO: luego tomar de ubicaciones
        rating: Number(p.rating_promedio) || 0,
        jobsCompleted,
        positiveFeedback,
        about:
          (p.descripcion as string) ||
          'Información del profesional aún no completada.',
        photos,
        ratingSummary: {
          totalReviews,
          distribution,
        },
        reviews,
      };

      return res.json(professionalProfile);
    }

    // 🟩 CLIENTE (rol === 1 u otro)
    const userResult = await pool.query(
      `SELECT id, nombre, apellido, email, telefono, foto_url
         FROM usuarios
        WHERE id = $1`,
      [id]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const u = userResult.rows[0];

    // TODO: cuando tengas la tabla de solicitudes, las traés aquí.
    const clientProfile = {
      photoUrl: u.foto_url as string,
      name: `${u.nombre} ${u.apellido}`,
      location: 'Montevideo, Uruguay', // TODO: luego sacarlo de ubicaciones
      email: u.email as string,
      phone: u.telefono as string,
      pendingRequests: [] as {
        id: string;
        serviceType: string;
        professionalName: string;
        status: string;
        createdAt: string;
      }[],
      completedWorks: [] as {
        id: string;
        title: string;
        description: string;
        professionalName: string;
        date: string;
      }[],
    };

    return res.json(clientProfile);
  } catch (e) {
    console.error('PROFILE /me ERROR', e);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

/**
 * PUT /v1/profiles/me
 * Actualiza datos básicos según rol.
 * - Profesional: especialidad + descripción (about)
 * - Cliente: nombre + teléfono (location pendiente para otra iteración)
 */
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const rol = req.user!.rol;

    if (rol === 2) {
      // PROFESIONAL
      const { specialty, about } = req.body as {
        specialty?: string;
        about?: string;
        location?: string;
      };

      if (!specialty && !about) {
        return res.status(400).json({ error: 'Nada para actualizar.' });
      }

      const existing = await pool.query(
        'SELECT id FROM perfiles_profesionales WHERE usuario_id = $1',
        [id]
      );

      const hasProfile = (existing.rowCount ?? 0) > 0;

      if (hasProfile) {
        await pool.query(
          `UPDATE perfiles_profesionales
              SET especialidad = COALESCE($1, especialidad),
                  descripcion = COALESCE($2, descripcion)
            WHERE usuario_id = $3`,
          [specialty || null, about || null, id]
        );
      } else {
        await pool.query(
          `INSERT INTO perfiles_profesionales (usuario_id, especialidad, descripcion)
           VALUES ($1, $2, $3)`,
          [id, specialty || null, about || null]
        );
      }

      return res.json({ message: 'Perfil profesional actualizado.' });
    }

    // CLIENTE
    const { name, phone } = req.body as {
      name?: string;
      location?: string;
      phone?: string;
    };

    let nombre: string | null = null;
    let apellido: string | null = null;

    if (name && name.trim() !== '') {
      const parts = name.trim().split(' ');
      nombre = parts[0];
      apellido = parts.slice(1).join(' ') || null;
    }

    await pool.query(
      `UPDATE usuarios
          SET nombre   = COALESCE($1, nombre),
              apellido = COALESCE($2, apellido),
              telefono = COALESCE($3, telefono)
        WHERE id = $4`,
      [nombre, apellido, phone || null, id]
    );

    return res.json({ message: 'Perfil de cliente actualizado.' });
  } catch (e) {
    console.error('PROFILE PUT /me ERROR', e);
    return res
      .status(500)
      .json({ error: 'Error en servidor al actualizar perfil' });
  }
});

/**
 * GET /v1/profiles/:id
 * Perfil público por ID de profesional.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const prof = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.foto_url,
              pp.especialidad, pp.descripcion,
              COALESCE(v.rating_promedio, 0)::float AS rating_promedio,
              COALESCE(v.total_resenas, 0)::int   AS total_resenas
         FROM usuarios u
         LEFT JOIN perfiles_profesionales pp ON pp.usuario_id = u.id
         LEFT JOIN v_profesional_rating v    ON v.profesional_id = u.id
        WHERE u.id = $1`,
      [id]
    );
    if (prof.rowCount === 0)
      return res.status(404).json({ error: 'Profesional no encontrado' });

    const fotos = await pool.query(
      `SELECT ti.url
         FROM trabajos t
         JOIN trabajo_imagenes ti ON ti.trabajo_id = t.id
        WHERE t.profesional_id = $1
        ORDER BY t.created_at DESC, ti.orden ASC
        LIMIT 6`,
      [id]
    );

    const resenas = await pool.query(
      `SELECT r.rating, r.comentario, r.created_at,
              uc.nombre || ' ' || COALESCE(uc.apellido,'') AS cliente_nombre,
              uc.foto_url AS cliente_foto
         FROM resenas r
         JOIN usuarios uc ON uc.id = r.cliente_id
        WHERE r.profesional_id = $1
        ORDER BY r.created_at DESC
        LIMIT 5`,
      [id]
    );

    return res.json({
      perfil: prof.rows[0],
      fotos: fotos.rows,
      resenas: resenas.rows,
    });
  } catch (e) {
    console.error('PROFILE /:id ERROR', e);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

/**
 * GET /v1/profiles/:id/works
 * Trabajos del profesional con sus imágenes.
 */
router.get('/:id/works', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rows = await pool.query(
      `SELECT t.id, t.titulo, t.descripcion, t.fecha,
              COALESCE(
                json_agg(
                  json_build_object('url', ti.url, 'orden', ti.orden)
                  ORDER BY ti.orden
                ) FILTER (WHERE ti.id IS NOT NULL),
                '[]'
              ) AS imagenes
         FROM trabajos t
         LEFT JOIN trabajo_imagenes ti ON ti.trabajo_id = t.id
        WHERE t.profesional_id = $1
        GROUP BY t.id
        ORDER BY t.created_at DESC`,
      [id]
    );
    return res.json(rows.rows);
  } catch (e) {
    console.error('WORKS GET ERROR', e);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

export default router;

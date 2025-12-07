// src/routes/private.route.ts
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
// Controllers
import { getCurrentUserController } from '../controllers/users.controller';
import {
  getMyProfessionalProfileController,
  createMyProfessionalProfileController,
  updateMyProfessionalProfileController,
} from '../controllers/profiles.controller';

const router = Router();

// --------------- USER ROUTES ---------------
router.get('/currentUser', getCurrentUserController); // Obtener datos del usuario autenticado

// --------------- PROFILE ROUTES ---------------
router.get('/profile', requireRole('PROFESIONAL'), getMyProfessionalProfileController); // Obtener perfil profesional del usuario autenticado
router.post('/profile', requireRole('PROFESIONAL'), createMyProfessionalProfileController); // Crear perfil profesional del usuario autenticado
router.patch('/profile', requireRole('PROFESIONAL'), updateMyProfessionalProfileController); // Actualizar perfil profesional del usuario autenticado

// --------------- UBICATION ROUTES ---------------




/**
 * POST /api/v1/private/app/works
 * Crea un trabajo/servicio realizado por el profesional.
 *
 * Body:
 * {
 *   "title": string;
 *   "description": string;
 *   "date"?: string;         // YYYY-MM-DD opcional
 *   "imageUrls"?: string[];  // opcional
 * }
 */
router.post(
  '/app/works',
  requireAuth,
  requireRole('PROFESIONAL'),
  async (req: Request, res: Response) => {
    try {
      const { title, description, date, imageUrls } = req.body;

      if (!title || !description) {
        return res.status(400).json({ message: 'title y description son obligatorios' });
      }

      // TODO: acá más adelante vas a guardar en la BD real.
      // Por ahora devolvemos un mock para que el frontend funcione.

      const newWork = {
        id: Date.now(), // ID mock
        titulo: title,
        descripcion: description,
        fecha: date || null,
        imagenes: Array.isArray(imageUrls)
          ? imageUrls.map((url: string, index: number) => ({
              url,
              orden: index,
            }))
          : [],
      };

      return res.status(201).json(newWork);
    } catch (err) {
      console.error('Error en POST /private/app/works', err);
      return res.status(500).json({ message: 'Error interno al crear el trabajo' });
    }
  },
);

export default router;

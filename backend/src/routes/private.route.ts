// src/routes/private.route.ts
import { Router, Request, Response } from 'express';
import { requireRole } from '../middlewares/requireRole.middleware';
// Controllers
import { getCurrentUserController } from '../controllers/users.controller';
import { searchServiciosController } from '../controllers/search.controller';
import {
  getMyProfessionalProfileController,
  getProfessionalProfileByIdController,
  createMyProfessionalProfileController,
  updateMyProfessionalProfileController,
} from '../controllers/profiles.controller';
import {
  getMyLocationsController,
  getLocationByIdController,
  createMyLocationController,
  updateMyLocationController,
  deleteMyLocationController,
} from '../controllers/locations.controller';
import {
  uploadWorkImageController,
  uploadProfileImageController,
} from '../controllers/uploads.controller';

import { uploadImage } from '../uploads/imageUpload';

const router = Router();

/**
 * Todas las rutas aquí dentro ya pasan por requireAuth,
 * porque el server las monta bajo: /api/v1/private → requireAuth → private.router
 */

// --------------- USER ROUTES ---------------
router.get('/currentUser', getCurrentUserController);

// --------------- PROFILE ROUTES ---------------
router.get('/profile', requireRole('PROFESIONAL'), getMyProfessionalProfileController); // Obtener perfil profesional del usuario autenticado
router.get('/profile/:userId', getProfessionalProfileByIdController);
router.post('/profile', requireRole('PROFESIONAL'), createMyProfessionalProfileController); // Crear perfil profesional del usuario autenticado
router.patch('/profile', requireRole('PROFESIONAL'), updateMyProfessionalProfileController); // Actualizar perfil profesional del usuario autenticado

// --------------- LOCATION ROUTES ---------------
router.get('/locations', getMyLocationsController); // Obtener todas las locaciones del usuario autenticado
router.get('/locations/:id', getLocationByIdController); // Obtener una locación por ID
router.post('/locations', createMyLocationController); // Crear una nueva locación
router.patch('/locations/:id', updateMyLocationController); // Actualizar una locación existente
router.delete('/locations/:id', deleteMyLocationController); // Eliminar una locación
// --------------- WORK ROUTES ---------------

// --------------- UPLOADS ROUTES ---------------
router.post(
  '/uploads/work-image',
  requireRole('PROFESIONAL'),
  uploadImage.single('image'),
  uploadWorkImageController,
);

router.post(
  '/uploads/profile-image',
  requireRole('PROFESIONAL'),
  uploadImage.single('image'),
  uploadProfileImageController,
);

// --------------- WORKS (Servicios / trabajos) ---------------
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
router.post('/app/works', requireRole('PROFESIONAL'), async (req: Request, res: Response) => {
  const { title, description, date, imageUrls } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'title y description son obligatorios' });
  }

  // TODO: guardar en la BD real.

  try {
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

  // TODO: acá más adelante vas a guardar en la BD real.
  // Por ahora devolvemos un mock para que el frontend funcione.

  // const newWork = {
  //   id: Date.now(), // ID mock
  //   titulo: title,
  //   descripcion: description,
  //   fecha: date || null,
  //   imagenes: Array.isArray(imageUrls)
  //     ? imageUrls.map((url: string, index: number) => ({
  //       url,
  //       orden: index,
  //     }))
  //     : [],
  // };

  //   return res.status(201).json(newWork);
  // } catch (err) {
  //   console.error('Error en POST /private/app/works', err);
  //   return res.status(500).json({ message: 'Error interno al crear el trabajo' });
  // }
});

/**
 * (Opcional) GET /api/v1/private/app/works
 * Para listar los trabajos del profesional en MyAccount / Profile.
 * Por ahora devuelve un array vacío o un mock.
 */
router.get('/app/works', requireRole('PROFESIONAL'), async (_req: Request, res: Response) => {
  // TODO: traer de la BD real
  return res.json([]);
});

// GET /api/v1/search/servicios?lat=-34.9&lng=-56.1&q=pintura&radiusKm=10
router.get('/search/servicios', searchServiciosController);

export default router;

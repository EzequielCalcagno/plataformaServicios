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

import {
  getReservationByIdController,
  createReservationController,
  listMyReservationsClienteController,
  listMyReservationsProfesionalController,
  profesionalAcceptReservationController,
  profesionalProposeController,
  profesionalCancelController,
  profesionalFinishController,
  clientAcceptProposalController,
  clientRejectProposalController,

  // ✅ NUEVOS controllers (tenés que crearlos/exportarlos en reservations.controller.ts)
  requesterFinishController,
  confirmFinishController,
  rejectFinishController,
} from '../controllers/reservations.controller';

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
router.get('/locations', getMyLocationsController);
router.get('/locations/:id', getLocationByIdController);
router.post('/locations', createMyLocationController);
router.patch('/locations/:id', updateMyLocationController);
router.delete('/locations/:id', deleteMyLocationController);

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
  try {
    const { title, description, date, imageUrls } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'title y description son obligatorios' });
    }

    const newWork = {
      id: Date.now(),
      titulo: title,
      descripcion: description,
      fecha: date || null,
      imagenes: Array.isArray(imageUrls)
        ? imageUrls.map((url: string, index: number) => ({ url, orden: index }))
        : [],
    };

    return res.status(201).json(newWork);
  } catch (err) {
    console.error('Error en POST /private/app/works', err);
    return res.status(500).json({ message: 'Error interno al crear el trabajo' });
  }
});

router.get('/app/works', requireRole('PROFESIONAL'), async (_req: Request, res: Response) => {
  return res.json([]);
});

// --------------- SEARCH ---------------
router.get('/search/servicios', searchServiciosController);

// --------------- RESERVATIONS (Sprint 4) ---------------

// Cliente/solicitante: crea solicitud (cualquiera puede ser solicitante)
router.post('/reservations', createReservationController);

// Solicitante: listar mis reservas (tabs)
router.get('/reservations/mine', listMyReservationsClienteController);

// Prestador (profesional asignado): listar reservas que me llegan (tabs)
router.get('/reservations/pro', requireRole('PROFESIONAL'), listMyReservationsProfesionalController);

// Prestador: acciones
router.patch('/reservations/:id/accept', requireRole('PROFESIONAL'), profesionalAcceptReservationController);
router.patch('/reservations/:id/propose', requireRole('PROFESIONAL'), profesionalProposeController);
router.patch('/reservations/:id/cancel', requireRole('PROFESIONAL'), profesionalCancelController);
router.patch('/reservations/:id/finish', requireRole('PROFESIONAL'), profesionalFinishController);

// Solicitante: responde a negociación (⚠️ NO requireRole)
router.patch('/reservations/:id/accept-proposal', clientAcceptProposalController);
router.patch('/reservations/:id/reject-proposal', clientRejectProposalController);

// ✅ NUEVAS: finalizar por solicitante + confirmación del otro (⚠️ NO requireRole)
router.patch('/reservations/:id/requester-finish', requesterFinishController);
router.patch('/reservations/:id/confirm-finish', confirmFinishController);
router.patch('/reservations/:id/reject-finish', rejectFinishController);

// Detalle
router.get('/reservations/:id', getReservationByIdController);

export default router;

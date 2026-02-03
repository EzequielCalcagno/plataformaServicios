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

  // ✅ estos dos son los que existen en tu controller (según el error)
  profesionalCancelController,
  profesionalFinishController,

  clientAcceptProposalController,
  clientRejectProposalController,

  requesterFinishController,
  confirmFinishController,
  rejectFinishController,

  rateReservationController,
  listProfessionalReviewsController,
} from '../controllers/reservations.controller';

const router = Router();

/**
 * Todas las rutas aquí dentro ya pasan por requireAuth,
 * porque el server las monta bajo: /api/v1/private → requireAuth → private.router
 */

// --------------- USER ROUTES ---------------
router.get('/currentUser', getCurrentUserController);

// --------------- PROFILE ROUTES ---------------
router.get('/profile', requireRole('PROFESIONAL'), getMyProfessionalProfileController);
router.get('/profile/:userId', getProfessionalProfileByIdController);
router.post('/profile', requireRole('PROFESIONAL'), createMyProfessionalProfileController);
router.patch('/profile', requireRole('PROFESIONAL'), updateMyProfessionalProfileController);

// --------------- LOCATION ROUTES ---------------
router.get('/locations', getMyLocationsController);
router.post('/locations', createMyLocationController);
router.patch('/locations/:id', updateMyLocationController);
router.delete('/locations/:id', deleteMyLocationController);

// --------------- UPLOADS ROUTES ---------------

// ✅ Work image: solo profesional
router.post(
  '/uploads/work-image',
  requireRole('PROFESIONAL'),
  uploadImage.single('image'),
  uploadWorkImageController,
);

// ✅ Profile image: cliente o profesional (SIN requireRole)
router.post(
  '/uploads/profile-image',
  uploadImage.single('image'),
  uploadProfileImageController,
);

// --------------- WORKS (ejemplo que tenías) ---------------
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

// --------------- RESERVATIONS ---------------

// Cliente/solicitante: crea solicitud
router.post('/reservations', createReservationController);

// Solicitante: listar mis reservas
router.get('/reservations/mine', listMyReservationsClienteController);

// Profesional: listar reservas que me llegan
router.get('/reservations/pro', requireRole('PROFESIONAL'), listMyReservationsProfesionalController);

// Profesional: acciones
router.patch('/reservations/:id/accept', requireRole('PROFESIONAL'), profesionalAcceptReservationController);
router.patch('/reservations/:id/propose', requireRole('PROFESIONAL'), profesionalProposeController);
router.patch('/reservations/:id/cancel', requireRole('PROFESIONAL'), profesionalCancelController);
router.patch('/reservations/:id/finish', requireRole('PROFESIONAL'), profesionalFinishController);

// Solicitante: responde a negociación (sin requireRole)
router.patch('/reservations/:id/accept-proposal', clientAcceptProposalController);
router.patch('/reservations/:id/reject-proposal', clientRejectProposalController);

// Nuevas: finalizar por solicitante + confirmación del otro (sin requireRole)
router.patch('/reservations/:id/requester-finish', requesterFinishController);
router.patch('/reservations/:id/confirm-finish', confirmFinishController);
router.patch('/reservations/:id/reject-finish', rejectFinishController);

// Detalle
router.get('/reservations/:id', getReservationByIdController);

// Calificación
router.patch('/reservations/:id/rate', rateReservationController);

// Reviews
router.get('/professionals/:id/reviews', listProfessionalReviewsController);

export default router;

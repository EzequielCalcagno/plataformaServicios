// src/routes/private.route.ts
import { Router, Request, Response } from 'express';
import { requireRole } from '../middlewares/requireRole.middleware';

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

// ✅ LIVE LOCATION controllers (los dos que ya tenés)
import {
  upsertLiveLocationController,
  disableLiveLocationController,
} from '../controllers/liveLocation.controller';

import {
  upsertMyProLiveLocationController,
  disableMyProLiveLocationController,
} from '../controllers/proLiveLocation.controller';

// ✅ SERVICES CRUD real (tabla public.servicios)
import {
  listMyServicesController,
  createMyServiceController,
  updateMyServiceController,
  deleteMyServiceController,
  getServiceSuggestionsController,
  bootstrapMyServicesController,
} from '../controllers/services.controller';

const router = Router();

// USER
router.get('/currentUser', getCurrentUserController);

// PROFILE
router.get('/profile', requireRole('PROFESIONAL'), getMyProfessionalProfileController);
router.get('/profile/:userId', getProfessionalProfileByIdController);
router.post('/profile', requireRole('PROFESIONAL'), createMyProfessionalProfileController);
router.patch('/profile', requireRole('PROFESIONAL'), updateMyProfessionalProfileController);

// LOCATIONS
router.get('/locations', getMyLocationsController);
router.post('/locations', createMyLocationController);
router.patch('/locations/:id', updateMyLocationController);
router.delete('/locations/:id', deleteMyLocationController);

// ✅ LIVE LOCATION (solo profesional)
router.post('/live-location', requireRole('PROFESIONAL'), upsertLiveLocationController);
router.delete('/live-location', requireRole('PROFESIONAL'), disableLiveLocationController);

// --------------- PRO LIVE LOCATION ---------------
router.patch('/pro-live-location', requireRole('PROFESIONAL'), upsertMyProLiveLocationController);
router.delete('/pro-live-location', requireRole('PROFESIONAL'), disableMyProLiveLocationController);

// ✅ SERVICES (REAL) - para que AddService inserte en public.servicios
router.get('/services', requireRole('PROFESIONAL'), listMyServicesController);
router.post('/services', requireRole('PROFESIONAL'), createMyServiceController);
router.patch('/services/:id', requireRole('PROFESIONAL'), updateMyServiceController);
router.delete('/services/:id', requireRole('PROFESIONAL'), deleteMyServiceController);

// ✅ NUEVO: sugerencias por categoría + bootstrap (precargar)
router.get('/services/suggestions', requireRole('PROFESIONAL'), getServiceSuggestionsController);
router.post('/services/bootstrap', requireRole('PROFESIONAL'), bootstrapMyServicesController);

// UPLOADS
router.post(
  '/uploads/work-image',
  requireRole('PROFESIONAL'),
  uploadImage.single('image'),
  uploadWorkImageController,
);

router.post(
  '/uploads/profile-image',
  uploadImage.single('image'),
  uploadProfileImageController,
);

// WORKS (ejemplo/mock)
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

// SEARCH
router.get('/search/servicios', searchServiciosController);

// RESERVATIONS...
router.post('/reservations', createReservationController);
router.get('/reservations/mine', listMyReservationsClienteController);
router.get('/reservations/pro', requireRole('PROFESIONAL'), listMyReservationsProfesionalController);

router.patch('/reservations/:id/accept', requireRole('PROFESIONAL'), profesionalAcceptReservationController);
router.patch('/reservations/:id/propose', requireRole('PROFESIONAL'), profesionalProposeController);
router.patch('/reservations/:id/cancel', requireRole('PROFESIONAL'), profesionalCancelController);
router.patch('/reservations/:id/finish', requireRole('PROFESIONAL'), profesionalFinishController);

router.patch('/reservations/:id/accept-proposal', clientAcceptProposalController);
router.patch('/reservations/:id/reject-proposal', clientRejectProposalController);

router.patch('/reservations/:id/requester-finish', requesterFinishController);
router.patch('/reservations/:id/confirm-finish', confirmFinishController);
router.patch('/reservations/:id/reject-finish', rejectFinishController);

router.get('/reservations/:id', getReservationByIdController);
router.patch('/reservations/:id/rate', rateReservationController);
router.get('/professionals/:id/reviews', listProfessionalReviewsController);

export default router;

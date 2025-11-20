// src/routes/private.route.ts
import { Router } from 'express';
//Middlewares
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

// Más cosas privadas después: /profiles/:id, /profiles/:id/locations, etc.

export default router;

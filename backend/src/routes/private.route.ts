// src/routes/private.route.ts
import { Router } from 'express';
import { getCurrentUserController } from '../controllers/users.controller';
import { getMyProfessionalProfileController } from '../controllers/profiles.controller';

const router = Router();

// Datos básicos del usuario autenticado
router.get('/me', getCurrentUserController);

// Perfil profesional del usuario autenticado
router.get('/profile', getMyProfessionalProfileController);

// Más cosas privadas después: /profiles/:id, /profiles/:id/locations, etc.

export default router;

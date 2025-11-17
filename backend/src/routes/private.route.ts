// src/routes/public.route.ts
import { Router } from 'express';
import { getCurrenteUserController } from '../controllers/usuarios.controller';

const router = Router();
// app.use('/v1/profiles', profileRouter); // GET /v1/profiles/:id, etc.
// app.use('/v1/works', worksRouter);
// router.get('/users', getAllUsuariosController);
router.get('/me', getCurrenteUserController);

export default router;

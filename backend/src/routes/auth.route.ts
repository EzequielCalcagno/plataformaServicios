// src/routes/auth.route.ts
import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';

const router = Router();

//Login, Register, generar token, etc.
router.post('/login', login);
router.post('/register', register);

export default router;

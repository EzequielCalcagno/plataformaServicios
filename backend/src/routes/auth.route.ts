// src/routes/auth.route.ts
import { Router } from 'express';
import { Login, Register } from '../controllers/auth.controller';

const router = Router();

//Login, Register, generar token, etc.
router.post('/login', Login);
router.post('/register', Register);

export default router;

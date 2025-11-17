// src/routes/auth.route.ts
import { Router } from 'express';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

const router = Router();

//Login, Register, generar token, etc.

router.post('/login', (req, res) => {
  // Lógica de login
});

router.post('/register', (req, res) => {
  // Lógica de registro
});

router.post('/token', (req, res) => {
//   const { userId } = req.body;
//   const token = generateToken(userId);
//   res.json({ token });
});

export default router;

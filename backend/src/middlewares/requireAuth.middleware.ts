// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: string;
  email: string;
  rolId: number;
}
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const payload = jwt.verify(token, secret) as JWTPayload;
    req.user = { id: payload.id, email: payload.email, rolId: payload.rolId };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

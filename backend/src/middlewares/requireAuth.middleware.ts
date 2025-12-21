// src/middlewares/requireAuth.middleware.ts
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
      user?: {
        id: string;
        email: string;
        rolId: number;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const payload = jwt.verify(token, secret) as JWTPayload;
    if (payload.id === undefined || payload.id === null) {
      return res.status(401).json({ error: 'Token sin id de usuario' });
    }

    req.user = { id: payload.id, email: payload.email, rolId: payload.rolId };
    next();
  } catch (err: any) {
    console.error('❌ Error en requireAuth (JWT verify):', err);
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

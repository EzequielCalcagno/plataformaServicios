// src/middleware/requireRole.ts
import { Request, Response, NextFunction } from 'express';
import { ROLES, RoleKey } from '../constants/roles';

export const requireRole =
  (...allowedRoles: RoleKey[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user; // lo que pusiste en el middleware de auth/JWT

    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userRoleId = user.rolId;

    const userHasRole = allowedRoles.some((roleKey) => ROLES[roleKey].id === userRoleId);

    if (!userHasRole) {
      return res.status(403).json({ error: 'No tenés permisos para esta acción' });
    }

    next();
  };

// src/middlewares/requireRole.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ROLES, RoleKey } from '../constants/roles';

export const requireRole =
  (...allowedRoles: RoleKey[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // viene desde requireAuth

    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userRoleId = user.rolId;

    const userHasRole = allowedRoles.some(
      (roleKey) => ROLES[roleKey].id === userRoleId,
    );

    if (!userHasRole) {
      return res
        .status(403)
        .json({ error: 'No tenés permisos para esta acción' });
    }

    next();
  };

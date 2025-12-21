// src/middlewares/errorLogger.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function errorLogger(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId ?? req.headers['x-request-id'] ?? 'no-request-id';
  console.error(`ERROR [${requestId}] ${req.method} ${req.originalUrl}`, err);
  next(err);
}

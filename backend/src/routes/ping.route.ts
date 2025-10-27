// src/routes/ping.route.ts
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Ruta de salud del sistema
 * GET /ping
 */
router.get('/ping', (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: 'pong 🏓',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: 'UP',
    timestamp: new Date().toISOString(),
  });
});

export default router;

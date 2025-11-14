// src/routes/health.route.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: 'UP',
    timestamp: new Date().toISOString(),
  });
});

export default router;

import { Request, Response } from 'express';

export const getHealth = async (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: 'UP',
    timestamp: new Date().toISOString(),
  });
};

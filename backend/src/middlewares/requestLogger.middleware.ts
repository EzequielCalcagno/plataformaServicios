// src/middlewares/requestLogger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

type LoggerOptions = {
  /** Si true, loguea también body (ojo con passwords) */
  logBody?: boolean;
  /** Paths a ignorar (health, swagger, etc.) */
  ignorePaths?: RegExp[];
};

const DEFAULT_IGNORE: RegExp[] = [
  /^\/api\/v1\/public\/health/i,
  /^\/api\/v1\/docs/i,
  /^\/favicon\.ico$/i,
];

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '"[unserializable]"';
  }
}

export function requestLogger(options: LoggerOptions = {}) {
  const ignorePaths = options.ignorePaths ?? DEFAULT_IGNORE;
  const logBody = options.logBody ?? false;

  return (req: Request, res: Response, next: NextFunction) => {
    // 1) request id
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();

    // lo dejamos disponible por si lo querés en otros lados
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);

    // 2) timer
    const start = process.hrtime.bigint();

    // 3) skip?
    const fullPath = req.originalUrl || req.url;
    if (ignorePaths.some((re) => re.test(fullPath))) {
      return next();
    }

    // 4) cuando termina la response, logueamos con status real
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1_000_000;

      const status = res.statusCode;
      const len = res.getHeader('content-length');
      const size = typeof len === 'string' ? len : Array.isArray(len) ? len[0] : len;

      const user = (req as any).user as { id: string; email: string; rolId: number } | undefined;

      const userTag = user ? ` userId=${user.id} rolId=${user.rolId}` : '';

      // log level simple por status
      const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';

      const base = `${level} [${requestId}] ${req.method} ${fullPath} -> ${status} (${ms.toFixed(
        1,
      )}ms${size ? `, ${size}b` : ''})${userTag}`;

      // ojo con logBody (passwords, tokens, etc.)
      if (logBody) {
        console.log(base, `body=${safeJson(req.body)}`);
      } else {
        console.log(base);
      }
    });

    next();
  };
}

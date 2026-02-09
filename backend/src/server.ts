// src/server.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// Routers
import publicRouter from './routes/public.route';
import authRouter from './routes/auth.route';
import privateRouter from './routes/private.route';

// Middlewares
import { requestLogger } from './middlewares/requestLogger.middleware';
import { errorLogger } from './middlewares/errorLogger.middleware';
import { requireAuth } from './middlewares/requireAuth.middleware';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;
const prefix = '/api/v1';

// ==========================
// CORS
// ==========================
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ==========================
// Middlewares globales
// ==========================
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  requestLogger({
    logBody: false, // true solo si estás debuggeando
    // ignorePaths: [/^\/api\/v1\/public\/health/i],
  }),
);
app.use(errorLogger);

// Routes
app.use(`${prefix}/public`, publicRouter);
app.use(`${prefix}/auth`, authRouter);
app.use(`${prefix}/private`, requireAuth, privateRouter);
//app.use(`${prefix}/app/works`, workUploadsRouter); // TODO: Revisar esta ruta que hace esta ruta y ponerla donde debe
//app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Servir archivos estáticos desde /uploads

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

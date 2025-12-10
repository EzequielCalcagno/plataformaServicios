// src/server.ts
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

// Routes
import publicRouter from './routes/public.route';
import authRouter from './routes/auth.route';
import privateRouter from './routes/private.route';
import workUploadsRouter from './routes/workUploads';
import path from 'path';
// Middlewares
import { requireAuth } from './middlewares/requireAuth.middleware';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;
const prefix = '/api/v1';

const corsOptions = {
  origin: '*', // Para produccion hay que dejar algo asi ['https://frontend.com', 'http://localhost:3000']
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

(async () => {
  try {
    // Aquí podrías inicializar la conexión a la base de datos u otros servicios
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(`${prefix}/public`, publicRouter);
app.use(`${prefix}/auth`, authRouter);
app.use(`${prefix}/private`, requireAuth, privateRouter);
app.use(`${prefix}/app/works`, workUploadsRouter); // TODO: Revisar esta ruta que hace esta ruta y ponerla donde debe
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Servir archivos estáticos desde /uploads

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

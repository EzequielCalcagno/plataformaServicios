// src/server.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.route';
import publicRouter from './routes/public.route';
import authRouter from './routes/auth.route';
import privateRouter from './routes/private.route';
import { requireAuth } from './middlewares/auth';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

const corsOptions = {
  origin: '*', // Para produccion hay que dejar algo asi ['https://frontend.com', 'http://localhost:3000']
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

(async () => {
  try {
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
app.use(`/api/v1/health`, healthRouter);
app.use(publicRouter);
app.use(`/api/v1/auth`, authRouter);
app.use(`/api/v1`, requireAuth, privateRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

// src/server.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.route.js';
import publicRouter from './routes/public.route.js';
// import authRouter from './routes/auth.route.js';
import privateRouter from './routes/private.route.js';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;
const prefix = '/api';
const version = '/v1';
const routesPrefix = `${prefix}${version}`;

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
app.use(`${routesPrefix}`, healthRouter);
app.use(`${routesPrefix}/`, publicRouter);
// app.use(`${routesPrefix}/auth`, authRouter);
app.use(`${routesPrefix}/private`, privateRouter);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

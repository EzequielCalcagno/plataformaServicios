// src/app.ts
import express from 'express';
// import publicRouter from './routes/public.route';
// import authRouter from './routes/auth.route';
// import privateRouter from './routes/private.route';
import pingRouter from './routes/ping.route';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
// app.use('/', publicRouter);
// app.use('/v1/auth', authRouter);
// app.use('/v1', privateRouter);
app.use('/api/v1', pingRouter);

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

export default app;

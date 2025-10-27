// src/server.ts
import express from 'express';
// import publicRouter from './routes/public.route';
// import authRouter from './routes/auth.route';
// import privateRouter from './routes/private.route';
import pingRouter from './routes/ping.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
// app.use('/', publicRouter);
// app.use('/v1/auth', authRouter);
// app.use('/v1', privateRouter);
app.use('/v1/ping', pingRouter);

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

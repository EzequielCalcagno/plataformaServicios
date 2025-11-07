// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.route';
import pingRouter from './routes/ping.route';
import { pool } from './db';              // 👈 importar pool

dotenv.config();

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Ruta de diagnóstico de DB ---
app.get('/dbcheck', async (_req, res) => {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    return res.json({ ok: true, db: 'connected', rowCount: r.rowCount });
  } catch (e: any) {
    console.error('DBCHECK ERROR', e);
    return res.status(500).json({ ok: false, error: e?.message });
  }
});

// Rutas normales
app.get('/', (_req, res) => res.json({ ok: true, service: 'PDS API' }));
app.use('/api/v1', pingRouter);
app.use('/v1/auth', authRouter);

// 404 (siempre al final)
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server on http://localhost:${PORT}`);
});

export default app;

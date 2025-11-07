// src/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // p.ej. postgres://postgres:tu_pass@localhost:5432/pds
  ssl: false,
});

// src/config/db.ts
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.DATABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!rawUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}
if (!supabaseKey) {
  throw new Error('SUPABASE_KEY environment variable is not set');
}

// saco barras finales por las dudas
const supabaseUrl = rawUrl.replace(/\/+$/, '');

// 👉 client de Supabase con service_role (SUPABASE_KEY)
const db = createClient(supabaseUrl, supabaseKey);

export default db;

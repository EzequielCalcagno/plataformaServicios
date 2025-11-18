import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.DATABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY environment variable is not set');
}

const db = createClient(supabaseUrl, supabaseKey);
export default db;

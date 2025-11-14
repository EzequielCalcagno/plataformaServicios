import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzresenofzmwjcscssow.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY environment variable is not set');
}

const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;

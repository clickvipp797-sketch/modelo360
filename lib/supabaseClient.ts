import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error("ERRO: A variável NEXT_PUBLIC_SUPABASE_URL não está definida corretamente no .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from "@supabase/supabase-js";

// Supabase URL & Public Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykfhjyzmrwphbxkauqlt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_krfOos0PHZ3LYbPDMWNQ0w_H-ULxxMd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export { supabase as default };

export const initSupabase = async () => supabase;

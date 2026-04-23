import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykfhjyzmrwphbxkauqlt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_krfOos0PHZ3LYbPDMWNQ0w_H-ULxxMd';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Cloud sync will be disabled.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase as default };

// Helper for dynamic initialization if needed elsewhere
export const initSupabase = async () => supabase;

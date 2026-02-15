
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * Target Project: exyefpzjknrgyyunsxyb
 */

const PROJECT_ID = "exyefpzjknrgyyunsxyb";
const PROJECT_URL = `https://${PROJECT_ID}.supabase.co`;

// This key is a placeholder. For a real project, the user should set 
// SUPABASE_ANON_KEY in their environment variables.
const PLACEHOLDER_KEY = "sb_publishable_lt7m7EVZP56c3ZMlRgdRog_CiZCZ_xd";

const envUrl = process.env.SUPABASE_URL;
const envKey = process.env.SUPABASE_ANON_KEY;

export const supabaseUrl = (envUrl && envUrl.startsWith('https://')) ? envUrl : PROJECT_URL;
export const supabaseAnonKey = (envKey && envKey.length > 20) ? envKey : PLACEHOLDER_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

if (!isSupabaseConfigured) {
  console.error("Supabase is not configured. Missing URL or Anon Key.");
} else {
    console.log(`Supabase Client initialized for project: ${PROJECT_ID}`);
}

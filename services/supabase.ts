// Declaración de tipos para variables de entorno de Vite
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Usar variables de entorno para mayor seguridad
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export the Supabase client, now strongly typed with the Database interface
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Supabase client-side auth uses localStorage by default.
    // This is secure and standard practice.
    persistSession: true,
    autoRefreshToken: true,
    // Set to true to automatically handle the auth token from the URL after email confirmation.
    detectSessionInUrl: true,
  },
});

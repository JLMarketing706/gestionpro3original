import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// These credentials were provided by the user.
const supabaseUrl = 'https://atonagdtvfsjoqimcvlc.supabase.co';
// WARNING: This key is publicly visible and should only be a public-facing anon key.
// In a real production app, this should come from environment variables.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0b25hZ2R0dmZzam9xaW1jdmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5Mzc3ODUsImV4cCI6MjA2ODUxMzc4NX0.CUUz-i21HEdT7G8qm1uOy89W3UKaDG6eGyD5nSxpvN0';

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
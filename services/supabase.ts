import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// These credentials were provided by the user.
const supabaseUrl = 'https://xqyrrwwnformdkubhgkr.supabase.co';
// WARNING: This key is publicly visible and should only be a public-facing anon key.
// In a real production app, this should come from environment variables.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeXJyd3duZm9ybWRrdWJoZ2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjMxODYsImV4cCI6MjA2NDYzOTE4Nn0.uS4Hu8-l9TtO42N4hUUcwuTKFQB6YEvbEkwqyZADhVQ';

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

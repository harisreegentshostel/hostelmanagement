import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://kncafxexsgnpgevgxbpi.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuY2FmeGV4c2ducGdldmd4YnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTIxNzcsImV4cCI6MjEwNzc4ODE3N30.BgMHgf0CeBX64Cdgwct59Dj-X07s3defUVALQlOEwxs';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

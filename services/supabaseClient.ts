import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your project's URL and anon key from your Supabase dashboard
// FIX: Explicitly type as string to prevent TypeScript from inferring a literal type,
// which causes an error when comparing to the placeholder string below.
const supabaseUrl: string = 'https://mygdfnzicmzjgfnodqly.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Z2RmbnppY216amdmbm9kcWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjM0MjEsImV4cCI6MjA3NjkzOTQyMX0.Fr4wZBW8ZpxZTwuOIGigcAZ0LzAu_w16CbInoAGmCm8';

export const isSupabaseConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

if (!isSupabaseConfigured) {
  console.warn(
    `Supabase credentials are not configured. The app will show a setup screen. Please update the placeholder values in 'services/supabaseClient.ts'.`
  );
}

// Use placeholder credentials that pass validation to prevent a startup crash.
// The app will show a configuration screen if the actual credentials are not set.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);
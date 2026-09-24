import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Enable Realtime for specific tables
export function enableRealtime() {
  if (!supabase) return;
  
  try {
    // Enable realtime for daily_logs
    supabase.channel('daily_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, payload => {
        console.log('Realtime change:', payload);
      })
      .subscribe();
      
    // Enable realtime for profiles
    supabase.channel('profile_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        console.log('Profile change:', payload);
      })
      .subscribe();
  } catch (error) {
    console.error('Error enabling realtime:', error);
  }
}

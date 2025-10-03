import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'social-pwa',
    },
  },
});

// Force reconnect when coming back from background
export const reconnectSupabase = async () => {
  try {
    console.log('Reconnecting Supabase...');
    
    // Force refresh the session
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      // If session refresh fails, try getting existing session
      await supabase.auth.getSession();
    } else {
      console.log('Session refreshed successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Reconnect error:', error);
    return false;
  }
};

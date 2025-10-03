import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  
  setSession: (session) => set({ session }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // Check if user is banned
        if (profile?.is_banned) {
          await supabase.auth.signOut();
          set({ 
            session: null, 
            user: null, 
            loading: false,
            initialized: true 
          });
          return;
        }
        
        set({ 
          session, 
          user: profile, 
          loading: false,
          initialized: true 
        });
      } else {
        set({ 
          session: null, 
          user: null, 
          loading: false,
          initialized: true 
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // Check if user is banned
        if (profile?.is_banned) {
          await supabase.auth.signOut();
          return { 
            error: { 
              message: `Hesabınız yasaklanmıştır. Neden: ${profile.ban_reason || 'Belirtilmedi'}` 
            } 
          };
        }

        set({ user: profile, session: data.session });
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signUp: async (email, password, username, fullName) => {
    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { error: { message: 'Username already exists' } };
      }

      // Sign up with metadata - trigger will create profile automatically
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        // Wait a bit for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch the created profile
        const { error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // Profile might not be ready yet, but user is created
          return { error: null };
        }

        // Update profile with correct username and full_name
        await supabase
          .from('profiles')
          .update({
            username,
            full_name: fullName,
          })
          .eq('id', data.user.id);

        // Add welcome bonus points
        await supabase.from('user_points_history').insert({
          user_id: data.user.id,
          points: 10,
          action_type: 'bonus',
        });

        // Fetch updated profile
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({ user: updatedProfile, session: data.session });
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  refreshUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          set({ user: profile });
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },
}));

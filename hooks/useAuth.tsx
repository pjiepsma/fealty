import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_stats (*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        isPremium: data.is_premium,
        createdAt: data.created_at,
        stats: data.user_stats || {
          totalMinutes: 0,
          totalPOIsClaimed: 0,
          currentKingOf: 0,
          longestStreak: 0,
          currentStreak: 0,
        },
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Sign up with Supabase Auth
    // The database trigger will automatically create the user profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });
    
    if (authError) {
      console.error('Auth sign up error:', authError);
      throw new Error(authError.message);
    }

    // Profile is automatically created by the database trigger (handle_new_user)
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Sign up successful, profile created by trigger');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

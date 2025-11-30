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
  updateUser: (updates: { username?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  refreshUser: async () => {},
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
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        isPremium: data.is_premium,
        totalSeconds: data.total_seconds || 0,
        totalPOIsClaimed: data.total_pois_claimed || 0,
        currentKingOf: data.current_king_of || 0,
        longestStreak: data.longest_streak || 0,
        currentStreak: data.current_streak || 0,
        lastActive: data.last_active,
        home_country: data.home_country,
        home_city: data.home_city,
        home_city_lat: data.home_city_lat,
        home_city_lng: data.home_city_lng,
        location_updated_at: data.location_updated_at,
        location_update_count: data.location_update_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
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

  const updateUser = async (updates: { username?: string }) => {
    if (!session?.user) {
      throw new Error('No user session');
    }

    const { error } = await supabase
      .from('users')
      .update({
        username: updates.username,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) throw error;

    // Refresh user data
    await fetchUserProfile(session.user.id);
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

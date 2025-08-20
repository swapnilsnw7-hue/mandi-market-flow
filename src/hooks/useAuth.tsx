import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '@/lib/auth';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: 'farmer' | 'trader' }) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { user: currentUser } = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer user role fetch to avoid blocking auth state update
          setTimeout(async () => {
            const { user: currentUser } = await authService.getCurrentUser();
            setUser(currentUser);
          }, 0);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    authService.getSession().then(({ session }) => {
      setSession(session);
      if (session?.user) {
        refreshUser();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: 'farmer' | 'trader' }) => {
    const result = await authService.signUp(email, password, userData);
    return result;
  };

  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    return result;
  };

  const signOut = async () => {
    const result = await authService.signOut();
    if (!result.error) {
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
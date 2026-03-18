import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { clearAllAuthCache, clearStaleAuthCache } from '@/lib/authStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_PASSWORD_PATH = '/reset-password';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const initialized = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    // Prevent double-initialization in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    // Remove any auth keys from the old project before hydrating
    clearStaleAuthCache();

    let isMounted = true;

    const syncAuthState = (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    };

    // 1. Set up listener FIRST (as recommended by Supabase docs)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info('[Auth] event:', event);

      // Only sync state, never do async work inside this callback
      syncAuthState(nextSession);

      // Mark initialization complete on first event
      if (isMounted) setInitializing(false);
    });

    // 2. Then hydrate the existing session
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (error) {
        console.error('[Auth] getSession error:', error.message);
      }
      if (isMounted) {
        syncAuthState(existingSession);
        setInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        const error = new Error('Please enter your email address.');
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      toast({ title: 'Sign in failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        const error = new Error('Please enter a valid email address.');
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      if (password.length < 6) {
        const error = new Error('Password must be at least 6 characters.');
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      // Auto-confirm is on but sometimes session isn't returned — force sign-in
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          toast({ title: 'Account created, but sign in failed', description: signInError.message, variant: 'destructive' });
          return { error: signInError };
        }
      }

      return { error: null };
    } catch (error: any) {
      toast({ title: 'Sign up failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        const error = new Error('Enter the email address for your account.');
        toast({ title: 'Password reset failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`,
      });

      if (error) {
        toast({ title: 'Password reset failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      toast({
        title: 'Password reset sent',
        description: "If an account exists for that email, you'll receive reset instructions shortly.",
      });

      return { error: null };
    } catch (error: any) {
      toast({ title: 'Password reset failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out failed:', error);
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (globalError) {
      console.error('Sign out failed completely:', globalError);
      toast({
        title: 'Sign out failed',
        description: "You've been logged out locally.",
        variant: 'destructive',
      });
    } finally {
      clearAllAuthCache();
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, initializing, signIn, signUp, signOut, requestPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ServerSession {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
}

interface AuthContextType {
  user: User | null;
  session: ServerSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set the Supabase client's in-memory session so data queries include the JWT
async function syncSupabaseSession(session: ServerSession | null) {
  if (session?.access_token && session?.refresh_token) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<ServerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      setUser(data.user ?? null);
      setSession(data.session ?? null);
      await syncSupabaseSession(data.session);
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: new Error(data.error || 'Login failed') };
      }
      setUser(data.user);
      setSession(data.session);
      await syncSupabaseSession(data.session);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signInWithMagicLink(email: string) {
    // Magic link still uses Supabase directly since it sends an email
    // The callback endpoint will handle setting the cookie when the user clicks the link
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: new Error(data.error || 'Signup failed') };
      }
      if (data.confirmationRequired) {
        return { error: null, confirmationRequired: true };
      }
      setUser(data.user);
      setSession(data.session);
      await syncSupabaseSession(data.session);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signOut() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      setSession(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithMagicLink, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

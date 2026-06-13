import React, { createContext, useState, useEffect } from 'react';
import { CONFIG } from '../constants/config';
import { supabase } from '../services/supabase';

export interface User {
  id_user: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Helper to fetch user details from the database by email
    const fetchDbUser = async (email: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id_user, username, email')
          .eq('email', email)
          .maybeSingle();
        if (error) {
          console.error('Error fetching DB user:', error);
          return null;
        }
        return data;
      } catch (e) {
        console.error('Exception fetching DB user:', e);
        return null;
      }
    };

    // Check existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const dbUser = await fetchDbUser(session.user.email);
          if (dbUser) {
            setUser({
              id_user: dbUser.id_user,
              username: dbUser.username,
              email: dbUser.email,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        const dbUser = await fetchDbUser(session.user.email);
        if (dbUser) {
          setUser({
            id_user: dbUser.id_user,
            username: dbUser.username,
            email: dbUser.email,
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Failed to sign out from Supabase:", e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useEffect } from 'react';
import { CONFIG } from '../constants/config';

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
    // Simulasi mengecek session dari SecureStore/AsyncStorage di React Native
    const checkSession = async () => {
      try {
        // Fallback or read from SecureStore
        setUser(null);
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    // Simpan ke AsyncStorage/SecureStore
  };

  const logout = async () => {
    setUser(null);
    // Hapus dari AsyncStorage/SecureStore
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

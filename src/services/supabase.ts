import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Custom storage wrapper to prevent AsyncStorage from throwing "window is not defined" during server-side rendering (SSR)
const safeStorage = {
  getItem: async (key: string) => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  }
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aufnfbyzpsicgwepyhxx.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1Zm5mYnl6cHNpY2d3ZXB5aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzUzMjgsImV4cCI6MjA3Mzg1MTMyOH0.W4Ov5qT71seyn0FK8jUN7_9TtKWrXOk5pMBpX0SN0Ds';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: safeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);


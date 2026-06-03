import { fetchJson } from './api';

export const authService = {
  login: async (payload: any) => {
    return await fetchJson('/auth', {
      method: 'POST',
      body: JSON.stringify({ ...payload, action: 'login' }),
    });
  },
  
  register: async (payload: any) => {
    return await fetchJson('/auth', {
      method: 'POST',
      body: JSON.stringify({ ...payload, action: 'register' }),
    });
  },

  verifyOtp: async (payload: { email: string; otp: string; purpose: string }) => {
    return await fetchJson('/auth/verifyOtp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  sendOtp: async (payload: { email: string; purpose: string }) => {
    return await fetchJson('/auth/sendOtp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resetPassword: async (payload: any) => {
    return await fetchJson('/auth/resetPassword', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  logout: async () => {
    return await fetchJson('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' }),
    });
  },
};

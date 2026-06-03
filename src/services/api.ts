import { CONFIG } from '../constants/config';

// Helper fetchJson kustom untuk memanggil API backend dengan auth header
export async function fetchJson(endpoint: string, init?: RequestInit) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  
  // Ambil token auth dari storage jika ada
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  // headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 204) return null;

  const type = res.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    return await res.json();
  }
  return await res.text();
}

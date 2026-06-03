import { fetchJson } from './api';

export const presenceService = {
  getPresences: async (idWorkspace: number) => {
    return await fetchJson(`/presences?idWorkspace=${idWorkspace}`);
  },

  getPresenceStats: async (idWorkspace: number) => {
    return await fetchJson(`/presences/stats?idWorkspace=${idWorkspace}`);
  },

  createPresence: async (idWorkspace: number, payload: { id_course: number; status: string; note?: string }) => {
    return await fetchJson(`/presences?idWorkspace=${idWorkspace}`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, id_workspace: idWorkspace }),
    });
  },

  updatePresence: async (idWorkspace: number, payload: { id_presence: number; id_course: number; status: string; note?: string }) => {
    return await fetchJson(`/presences?idWorkspace=${idWorkspace}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

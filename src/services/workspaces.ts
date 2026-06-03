import { fetchJson } from './api';

export const workspaceService = {
  getWorkspaces: async (idUser: number) => {
    return await fetchJson(`/workspaces?id_user=${idUser}`);
  },

  createWorkspace: async (payload: { name: string; id_user: number }) => {
    return await fetchJson('/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateWorkspace: async (payload: { id_workspace: number; name: string }) => {
    return await fetchJson('/workspaces', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteWorkspace: async (idWorkspace: number) => {
    return await fetchJson('/workspaces', {
      method: 'DELETE',
      body: JSON.stringify({ id_workspace: idWorkspace }),
    });
  },
};

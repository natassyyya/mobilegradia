import { fetchJson } from './api';

export const taskService = {
  getTasks: async (idWorkspace: number) => {
    return await fetchJson(`/tasks?idWorkspace=${idWorkspace}`);
  },

  createTask: async (idWorkspace: number, payload: any) => {
    return await fetchJson(`/tasks?idWorkspace=${idWorkspace}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTask: async (idWorkspace: number, payload: any) => {
    return await fetchJson(`/tasks?idWorkspace=${idWorkspace}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteTask: async (idWorkspace: number, idTask: number) => {
    return await fetchJson(`/tasks?id=${idTask}&idWorkspace=${idWorkspace}`, {
      method: 'DELETE',
    });
  },
};

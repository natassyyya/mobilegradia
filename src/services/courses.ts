import { fetchJson } from './api';

export const courseService = {
  getCourses: async (idWorkspace: number) => {
    return await fetchJson(`/courses?idWorkspace=${idWorkspace}`);
  },

  getCoursesToday: async (idWorkspace: number) => {
    return await fetchJson(`/courses?q=today&idWorkspace=${idWorkspace}`);
  },

  createCourse: async (payload: any) => {
    return await fetchJson('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCourse: async (payload: any) => {
    return await fetchJson('/courses', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteCourse: async (idCourse: number) => {
    return await fetchJson(`/courses?id=${idCourse}`, {
      method: 'DELETE',
    });
  },
};

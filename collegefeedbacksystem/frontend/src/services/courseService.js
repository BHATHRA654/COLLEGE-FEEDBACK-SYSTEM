import api from './axiosConfig';

export const courseService = {
  getAll: async () => {
    return api.get('/courses');
  },
  getById: async (id) => {
    return api.get(`/courses/${id}`);
  },
  getByDepartment: async (departmentId) => {
    return api.get(`/courses/department/${departmentId}`);
  },
  create: async (courseData) => {
    return api.post('/courses', courseData);
  },
  update: async (id, courseData) => {
    return api.put(`/courses/${id}`, courseData);
  },
  delete: async (id) => {
    return api.delete(`/courses/${id}`);
  }
};

import api from './axiosConfig';

export const departmentService = {
  getAll: async () => {
    return api.get('/departments');
  },
  getById: async (id) => {
    return api.get(`/departments/${id}`);
  },
  create: async (departmentData) => {
    return api.post('/departments', departmentData);
  },
  update: async (id, departmentData) => {
    return api.put(`/departments/${id}`, departmentData);
  },
  delete: async (id) => {
    return api.delete(`/departments/${id}`);
  }
};

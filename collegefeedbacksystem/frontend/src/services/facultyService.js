import api from './axiosConfig';

export const facultyService = {
  getAll: async () => {
    return api.get('/faculty');
  },
  getById: async (id) => {
    return api.get(`/faculty/${id}`);
  },
  getByDepartment: async (departmentId) => {
    return api.get(`/faculty/department/${departmentId}`);
  },
  create: async (facultyData) => {
    return api.post('/faculty', facultyData);
  },
  update: async (id, facultyData) => {
    return api.put(`/faculty/${id}`, facultyData);
  },
  delete: async (id) => {
    return api.delete(`/faculty/${id}`);
  }
};

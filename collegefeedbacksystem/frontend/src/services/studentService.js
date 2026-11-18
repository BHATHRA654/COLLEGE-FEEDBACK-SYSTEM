import api from './axiosConfig';

export const studentService = {
  getAll: async () => {
    return api.get('/students');
  },
  getById: async (id) => {
    return api.get(`/students/${id}`);
  },
  getByDepartment: async (departmentId) => {
    return api.get(`/students/department/${departmentId}`);
  },
  create: async (studentData) => {
    return api.post('/students', studentData);
  },
  update: async (id, studentData) => {
    return api.put(`/students/${id}`, studentData);
  },
  delete: async (id) => {
    return api.delete(`/students/${id}`);
  }
};

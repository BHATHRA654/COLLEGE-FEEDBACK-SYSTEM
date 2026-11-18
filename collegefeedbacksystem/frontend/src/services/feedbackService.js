import api from './axiosConfig';

export const feedbackService = {
  getAll: async () => {
    return api.get('/feedback');
  },
  getById: async (id) => {
    return api.get(`/feedback/${id}`);
  },
  getByStudent: async (studentId) => {
    return api.get(`/feedback/student/${studentId}`);
  },
  getByFaculty: async (facultyId) => {
    return api.get(`/feedback/faculty/${facultyId}`);
  },
  getByCourse: async (courseId) => {
    return api.get(`/feedback/course/${courseId}`);
  },
  create: async (feedbackData) => {
    return api.post('/feedback', feedbackData);
  },
  delete: async (id) => {
    return api.delete(`/feedback/${id}`);
  }
};

import api from './axiosConfig';

export const reportService = {
  getSummary: async () => {
    return api.get('/reports/summary');
  },
  getFacultyRating: async (facultyId) => {
    return api.get(`/reports/faculty/${facultyId}/average-rating`);
  },
  getCourseRating: async (courseId) => {
    return api.get(`/reports/course/${courseId}/average-rating`);
  }
};

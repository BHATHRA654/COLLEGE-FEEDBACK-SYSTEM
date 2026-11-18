import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Use Vite proxy via relative /api
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Safe development logging for failed API calls
    if (import.meta.env.DEV) {
      const requestUrl = error.config?.url || 'Unknown URL';
      const requestMethod = error.config?.method?.toUpperCase() || 'Unknown Method';
      const statusCode = error.response?.status || 'Network Error';
      const responseMessage = error.response?.data?.message || error.message || 'No details';
      
      console.error('[API Request Failed]', {
        url: requestUrl,
        method: requestMethod,
        status: statusCode,
        message: responseMessage
      });
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

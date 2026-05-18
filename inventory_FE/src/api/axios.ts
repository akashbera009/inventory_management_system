import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    // Print request details
    console.log('================ API REQUEST ================');
    console.log('URL:', `${config.baseURL}${config.url}`);
    console.log('METHOD:', config.method?.toUpperCase());
    console.log('HEADERS:', config.headers);
    console.log('BODY:', config.data);
    console.log('PARAMS:', config.params);
    console.log('============================================');

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('================ API RESPONSE ================');
    console.log('URL:', response.config.url);
    console.log('STATUS:', response.status);
    console.log('DATA:', response.data);
    console.log('=============================================');

    return response;
  },
  (error) => {
    console.error('================ API ERROR =================');
    console.error('URL:', error.config?.url);
    console.error('STATUS:', error.response?.status);
    console.error('ERROR DATA:', error.response?.data);
    console.error('============================================');

    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

export default apiClient;

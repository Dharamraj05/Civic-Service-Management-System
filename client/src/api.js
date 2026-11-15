import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('csms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((item) => item.message).join(' ');
  }
  if (!error?.response) {
    return 'Cannot reach the CSMS API. Start the backend in the server folder (npm run dev) on port 5000, then refresh.';
  }
  return data?.message || fallback;
}

export default api;

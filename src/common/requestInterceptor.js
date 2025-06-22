import axios from 'axios';
import {properties} from '../properties';
import { toast } from 'react-toastify';

let accessToken = null;

const api = axios.create({
  baseURL: properties.base_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header if token is available
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Retry with a new token if 401 occurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(properties.auth_url, {
          client_id: properties.client_id,
          client_secret: properties.client_secret,
          grant_type: "client_credentials",
        });

        accessToken = res.data.access_token;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error('Token acquisition failed:', err);
        toast.error("Please try again...");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
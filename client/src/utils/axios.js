import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
const API_URL = configuredApiUrl?.endsWith("/api/v1")
  ? configuredApiUrl
  : `${configuredApiUrl}/api/v1`;

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ✅ ADD THIS - Token interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ ADD THIS - Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
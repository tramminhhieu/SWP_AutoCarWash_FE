import axios from "axios";
import { getToken, clearTokens } from "../utils/storage";

// 1 instance axios dùng chung toàn app
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự gắn Authorization header nếu có token
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự xử lý khi 401 (hết hạn token) — ở đây để stub, phần refresh token
// sẽ implement chi tiết hơn khi làm module Auth
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
    }
    return Promise.reject(error);
  },
);

export default axiosClient;

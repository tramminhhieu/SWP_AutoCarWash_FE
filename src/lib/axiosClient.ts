import axios from "axios";
import { getToken, clearTokens } from "../utils/storage";
import type { ApiErrorResponse } from "../types/apiResponse";

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

// Helper: lấy errorCode và message từ lỗi một cách an toàn (không dùng any).
// Nhận cả AxiosError thật và lỗi mock có cùng shape { response: { data: ApiErrorResponse } }
// (dùng khi test với mock data, xem src/mocks/authMockData.ts).
export const getApiErrorInfo = (
  error: unknown,
): { errorCode: string | null; message: string | null } => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      errorCode: error.response?.data?.errorCode ?? null,
      message: error.response?.data?.message ?? null,
    };
  }

  // Duck-typing: chấp nhận lỗi không phải AxiosError thật nhưng có đúng cấu trúc
  // response.data.errorCode/message (dùng cho mock error khi test UI)
  if (
    error instanceof Error &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const data = (error as { response?: { data?: Partial<ApiErrorResponse> } })
      .response?.data;
    return {
      errorCode: data?.errorCode ?? null,
      message: data?.message ?? null,
    };
  }

  return { errorCode: null, message: null };
};

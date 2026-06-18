// Format response chung cho mọi API thành công (theo API.txt)
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

// Format response chung cho mọi API lỗi (theo API.txt)
export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  error?: Record<string, unknown>;
}

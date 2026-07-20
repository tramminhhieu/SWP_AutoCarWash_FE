import type { RoleType } from "./enums";
// ====== POST /api/v1/auth/login ======

// Request: 1 field "identity" duy nhất cho cả email hoặc số điện thoại
export interface LoginRequest {
  identity: string;
  password: string;
}

// Response thành công: chỉ có token + message + name, không theo format chung ApiSuccessResponse
export interface LoginResponse {
  token: string;
  message: string;
  name?: string;
  // Station của staff đang đăng nhập (null với CUSTOMER/ADMIN) — dùng thay cho STATION_ID
  // hardcode ở luồng Walk-in, xem AuthServiceImpl.login() bên BE.
  stationId?: number;
}

// Request gửi lên BE khi đăng ký
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  birthday: string; // yyyy-MM-dd, lấy trực tiếp từ <input type="date">
  phone: string;
  email: string;
  password: string;
}

// 1 lỗi field cụ thể BE trả về khi validate thất bại (email/phone trùng, password sai...)
export interface RegisterFieldError {
  field: "email" | "phone" | "password" | string;
  errorCode: string;
  message: string;
}

// Payload thật sự nằm trong JWT, BE encode bằng JWTClaimsSet (xem Login.tsx/AuthContext)
export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  email: string;
  name?: string;
  roles?: RoleType;
  stationId?: number; // chỉ có với STAFF, không có với CUSTOMER/ADMIN
}

// Thông tin user rút ra từ token sau khi decode, dùng trong AuthContext
export interface AuthUser {
  userId: number;
  email: string;
  name?: string;
  role: RoleType;
  // Station của staff (từ LoginResponse.stationId, không nằm trong JWT) — undefined với CUSTOMER/ADMIN
  stationId?: number;
}

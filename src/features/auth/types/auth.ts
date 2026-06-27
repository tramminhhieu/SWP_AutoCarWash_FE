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
// Lưu ý: BE cần bổ sung claim "name" (đã thống nhất với BE), nếu chưa có sẽ là undefined
export interface JwtPayload {
  sub: string; // userId
  iat: number;
  exp: number;
  email: string;
  name?: string;
  roles: string | string[];
}

// Thông tin user rút ra từ token sau khi decode, dùng trong AuthContext
export interface AuthUser {
  userId: number;
  email: string;
  name?: string;
  role: RoleType;
}

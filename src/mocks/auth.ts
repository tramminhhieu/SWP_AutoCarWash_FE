import type { LoginRequest, LoginResponse } from "../features/auth/types/auth";

// ⚠️ MOCK - dùng tạm để test login khi chưa muốn gọi BE thật.
// Khi cần gọi BE thật lại, sửa authApi.ts để gọi axiosClient như code gốc (xem comment ở đó).

// JWT token giả nhưng ĐÚNG FORMAT (3 phần base64), jwt-decode parse được payload:
// { sub: "1", roles: "Customer", email: "admin@gmail.com", firstName: "Phong", iat, exp }
// Token hết hạn sau ~7 ngày kể từ lúc tạo file này. Nếu jwt-decode báo lỗi "hết hạn",
// tạo lại token mới (xem hướng dẫn ở cuối file).
const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzgxNzczOTUwLCJleHAiOjE3ODIzNzg3NTAsInJvbGVzIjoiQ3VzdG9tZXIiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6IlBob25nIn0.LZn5MCi8AuPhcQFshXQV2fvchxznvFUPXDvzvN-ckbI";

// Tài khoản mock duy nhất dùng để test (đúng theo yêu cầu: 1 user mẫu)
const MOCK_ACCOUNT = {
  identity: "admin@gmail.com",
  password: "123456",
};

// Giả lập độ trễ mạng để UI loading hiển thị thật hơn
const MOCK_DELAY_MS = 500;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Lỗi giả định dạng giống ApiErrorResponse, dùng để ném ra khi sai thông tin
class MockApiError extends Error {
  response: { data: { success: false; message: string; errorCode: string } };

  constructor(errorCode: string, message: string) {
    super(message);
    this.response = { data: { success: false, message, errorCode } };
  }
}

// MOCK: giả lập đúng hành vi của POST /api/v1/auth/login theo các AC đã định nghĩa
export const mockLogin = async (
  payload: LoginRequest,
): Promise<LoginResponse> => {
  await delay(MOCK_DELAY_MS);

  // AC-01.5 (để trống) đã được validate ở FE trước khi gọi tới đây, không cần check lại

  // AC-01.2 + AC-01.3: sai thông tin (không phân biệt để tránh tiết lộ tài khoản tồn tại)
  if (
    payload.identity !== MOCK_ACCOUNT.identity ||
    payload.password !== MOCK_ACCOUNT.password
  ) {
    throw new MockApiError(
      "INVALID_CREDENTIALS",
      "Email/Số điện thoại hoặc mật khẩu không chính xác",
    );
  }

  // AC-01: đăng nhập thành công
  return {
    token: MOCK_TOKEN,
    message: "Đăng nhập thành công",
  };
};

/* ====== Hướng dẫn tạo lại MOCK_TOKEN mới khi token cũ hết hạn ======
Chạy đoạn Python sau (hoặc tương đương) để sinh token mới:

import base64, json, hmac, hashlib, time

header = {"alg": "HS256", "typ": "JWT"}
now = int(time.time())
payload = {
    "sub": "1", "iat": now, "exp": now + 7 * 24 * 3600,
    "roles": "Customer", "email": "admin@gmail.com", "firstName": "Phong"
}

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

h = b64url(json.dumps(header, separators=(",", ":")).encode())
p = b64url(json.dumps(payload, separators=(",", ":")).encode())
sig = hmac.new(b"mock-secret", f"{h}.{p}".encode(), hashlib.sha256).digest()
print(f"{h}.{p}.{b64url(sig)}")
====================================================================== */

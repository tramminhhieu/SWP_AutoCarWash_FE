import { useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, setToken, clearTokens } from "../utils/storage";
import type { AuthUser, JwtPayload } from "../features/auth/types/auth";
import type { RoleType } from "../features/auth/types/enums";
import { AuthContext } from "./AuthContextObject";

// Chuẩn hóa claim "roles": BE có thể trả string đơn hoặc array, có thể có
// prefix "ROLE_" (convention Spring Security) -> luôn quy về 1 RoleType sạch
const extractRole = (rolesClaim: JwtPayload["roles"]): RoleType => {
  const rawRole = Array.isArray(rolesClaim) ? rolesClaim[0] : rolesClaim;
  return rawRole.replace(/^ROLE_/, "") as RoleType;
};

// Decode JWT token thành AuthUser, trả về null nếu token không hợp lệ/hết hạn
const decodeUserFromToken = (token: string): AuthUser | null => {
  try {
    const payload = jwtDecode<JwtPayload>(token);

    // Kiểm tra token hết hạn (exp tính bằng giây, Date.now() tính bằng ms)
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      userId: Number(payload.sub),
      email: payload.email,
      name: payload.name,
      role: extractRole(payload.roles),
    };
  } catch {
    return null;
  }
};

// Tính state user ban đầu từ token đã lưu (nếu có), dùng làm lazy initializer cho useState.
// Đặt ngoài component để không bị tạo lại mỗi lần render.
const getInitialUser = (): AuthUser | null => {
  const existingToken = getToken();
  if (!existingToken) return null;

  const decodedUser = decodeUserFromToken(existingToken);
  if (!decodedUser) {
    // Token hỏng hoặc hết hạn -> dọn luôn, không giữ token rác trong storage
    clearTokens();
    return null;
  }

  return decodedUser;
};

// CHỈ tạo AuthProvider (component) ở đây - Context object đã tách ra AuthContextObject.ts
// KHÔNG export useAuth ở đây (đã chuyển sang hooks/useAuth.ts)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Lazy initializer: getInitialUser() chỉ chạy đúng 1 lần lúc mount, không cần useEffect
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [isLoading] = useState(false);

  // Gọi sau khi login API trả về token thành công
  const loginWithToken = (token: string, name?: string) => {
    setToken(token);
    const decodedUser = decodeUserFromToken(token);
    if (decodedUser && name) {
      setUser({ ...decodedUser, name });
    } else {
      setUser(decodedUser);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

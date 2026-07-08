import { useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import {
  getToken,
  setToken,
  clearTokens,
  getUserName,
  setUserName,
  getStationId,
  setStationId,
} from "../utils/storage";
import type { AuthUser, JwtPayload } from "../features/auth/types/auth";
import { AuthContext } from "./AuthContextObject";

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
      role: payload.roles ?? "CUSTOMER",
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

  const savedName = getUserName();
  const savedStationId = getStationId();
  return {
    ...decodedUser,
    ...(savedName ? { name: savedName } : {}),
    ...(savedStationId != null ? { stationId: savedStationId } : {}),
  };
};

// CHỈ tạo AuthProvider (component) ở đây - Context object đã tách ra AuthContextObject.ts
// KHÔNG export useAuth ở đây (đã chuyển sang hooks/useAuth.ts)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Lazy initializer: getInitialUser() chỉ chạy đúng 1 lần lúc mount, không cần useEffect
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [isLoading] = useState(false);

  // Gọi sau khi login API trả về token thành công
  const loginWithToken = (token: string, name?: string, stationId?: number) => {
    setToken(token);
    if (name) setUserName(name);
    if (stationId != null) setStationId(stationId);
    const decodedUser = decodeUserFromToken(token);
    setUser(
      decodedUser && {
        ...decodedUser,
        ...(name ? { name } : {}),
        ...(stationId != null ? { stationId } : {}),
      },
    );
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  // Gọi sau khi update profile thành công, đồng bộ lại tên hiển thị trên header
  const updateUserName = (name: string) => {
    setUserName(name); // ghi vào localStorage để giữ qua reload
    setUser((prev) => (prev ? { ...prev, name } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithToken,
        logout,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

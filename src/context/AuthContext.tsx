import { createContext, useState, type ReactNode } from "react";
// author: Ngọc — import thêm setToken, clearTokens để lưu token thật
import { setToken, clearTokens } from "../utils/storage";
// author: Ngọc — import axiosClient để gọi API login thật
import axiosClient from "../lib/axiosClient";

/**
 * Shape user lưu trong AuthContext.
 * firstName/lastName khớp với bảng customer trong DB.
 */
export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  // author: Ngọc — thêm MANAGER, EMPLOYEE cho role staff
  role: "CUSTOMER" | "STAFF" | "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  // author: Ngọc — login nhận identity + password, trả về Promise
  login: (identity: string, password: string) => Promise<void>;
  logout: () => void;
}

// Mock user giả để test UI - chưa nối API/token thật
// author: Ngọc — comment out MOCK_USER vì dùng API thật
// const MOCK_USER: AuthUser = {
//   id: 1,
//   firstName: "Tấn",
//   lastName: "Phong",
//   email: "tanphong@example.com",
//   role: "CUSTOMER",
// };

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // TẠM: set sẵn MOCK_USER ngay khi load để test UI trạng thái đã login,
  // không cần bấm nút gì. Khi nối API thật, đổi lại thành useState(null)
  // và để login() thật set user sau khi gọi authApi.login() thành công.
  // author: Ngọc — đổi từ useState(MOCK_USER) sang useState(null)
  // const [user, setUser] = useState<AuthUser | null>(MOCK_USER);
  const [user, setUser] = useState<AuthUser | null>(null);

  // TODO: thay bằng gọi authApi.login() thật khi nối backend
  // author: Ngọc — login gọi API thật, lưu token vào localStorage
  const login = async (identity: string, password: string) => {
    const res = await axiosClient.post("/api/v1/auth/login", { identity, password });
    const data = res.data.data;
    setToken(data.token);
    setUser({
      id: 0,
      firstName: data.name,
      lastName: "",
      email: data.email,
      role: "STAFF",
    });
  };

  // TODO: thay bằng gọi authApi.logout() + clearTokens() thật khi nối backend
  const logout = () => {
    // author: Ngọc — thêm clearTokens() để xóa token khỏi localStorage
    clearTokens();
    setUser(null);
  };

  const value: AuthContextValue = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
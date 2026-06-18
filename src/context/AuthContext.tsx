import { createContext, useState, type ReactNode } from "react";

/**
 * Shape user lưu trong AuthContext.
 * firstName/lastName khớp với bảng customer trong DB.
 */
export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: () => void;
  logout: () => void;
}

// Mock user giả để test UI - chưa nối API/token thật
const MOCK_USER: AuthUser = {
  id: 1,
  firstName: "Tấn",
  lastName: "Phong",
  email: "tanphong@example.com",
  role: "CUSTOMER",
};
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
  const [user, setUser] = useState<AuthUser | null>(MOCK_USER);

  // TODO: thay bằng gọi authApi.login() thật khi nối backend
  const login = () => {
    setUser(MOCK_USER);
  };

  // TODO: thay bằng gọi authApi.logout() + clearTokens() thật khi nối backend
  const logout = () => {
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

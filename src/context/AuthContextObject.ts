import { createContext } from "react";
import type { AuthUser } from "../features/auth/types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithToken: (token: string, name?: string) => void;
  logout: () => void;
}

// Chỉ tạo Context object ở đây - tách riêng khỏi AuthProvider (component)
// để Fast Refresh hoạt động đúng (eslint: react-refresh/only-export-components)
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

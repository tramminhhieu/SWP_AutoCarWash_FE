import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook lấy AuthContext ra dùng ở bất kỳ component nào.
 * Throw lỗi rõ ràng nếu dùng ngoài AuthProvider, giúp dễ debug.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }

  return context;
}

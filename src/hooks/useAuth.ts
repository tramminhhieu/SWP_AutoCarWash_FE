import { useContext } from "react";
import { AuthContext } from "../context/AuthContextObject";

// Hook lấy AuthContext ra dùng ở bất kỳ component nào
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng trong AuthProvider");
  }
  return context;
};

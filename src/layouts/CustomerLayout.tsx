import { Outlet } from "react-router-dom";
import CustomerHeader from "./CustomerHeader";
import CustomerFooter from "./CustomerFooter";
import { useAuth } from "../hooks/useAuth";

/**
 * Khung giao diện chung cho mọi trang khách hàng.
 * Render Header cố định + nội dung trang (qua Outlet) bên dưới.
 */
export default function CustomerLayout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9ff]">
      <CustomerHeader
        isAuthenticated={isAuthenticated}
        user={
          user
            ? {
                firstName: user.firstName,
                role: user.role,
              }
            : undefined
        }
        onLogout={logout}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <CustomerFooter />
    </div>
  );
}

import { Outlet, useLocation } from "react-router-dom";
import CustomerHeader from "./CustomerHeader";
import CustomerFooter from "./CustomerFooter";
import { useAuth } from "../hooks/useAuth";
import BackButton from "../components/ui/BackButton";

const HIDDEN_ROUTES = ["/", "/login", "/register"];

function BackButtonWrapper() {
  const location = useLocation();
  if (location.key === "default" || HIDDEN_ROUTES.includes(location.pathname)) {
    return null;
  }
  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-12">
      <BackButton />
    </div>
  );
}

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
                name: user.name,
                email: user.email,
              }
            : undefined
        }
        onLogout={logout}
      />

      <main className="flex-1">
        <BackButtonWrapper />
        <Outlet />
      </main>

      <CustomerFooter />
    </div>
  );
}

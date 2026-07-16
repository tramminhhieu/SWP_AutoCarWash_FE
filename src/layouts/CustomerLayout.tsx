import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import CustomerHeader from "./CustomerHeader";
import CustomerFooter from "./CustomerFooter";
import { useAuth } from "../hooks/useAuth";
import BackButton from "../components/ui/BackButton";
import { getCustomerProfile } from "../features/customer/api/profileApi";

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
  const { isAuthenticated, user, logout, updateUserName } = useAuth();
  const navigate = useNavigate();

  // API login trả về "name" chung (đôi khi là tên tài khoản hệ thống, không phải tên thật
  // của customer) - fetch lại profile thật để header luôn hiện đúng firstName + lastName,
  // không cần đợi user vào trang Profile bấm Save mới đồng bộ.
  useEffect(() => {
    if (user?.role !== "CUSTOMER") return;
    let cancelled = false;
    getCustomerProfile()
      .then((res) => {
        if (cancelled) return;
        const { firstName, lastName } = res.data.customer;
        updateUserName(`${lastName} ${firstName}`.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.role]);

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
        onLogout={() => {
          logout();
          navigate("/");
        }}
      />

      <main className="flex-1">
        <BackButtonWrapper />
        <Outlet />
      </main>

      <CustomerFooter />
    </div>
  );
}

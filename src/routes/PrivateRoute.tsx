import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/ui/Loading";

// Bọc các route cần đăng nhập (dùng dạng <Route element={<PrivateRoute />}> rồi
// nest các <Route> con bên trong - children sẽ render qua <Outlet />).
// Chưa đăng nhập -> redirect về /login, kèm "from" để Login biết quay lại
// đúng trang sau khi đăng nhập thành công (xử lý ở Login.tsx).
const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Đang xác định trạng thái đăng nhập (vd vừa F5 trang, AuthContext đang đọc
  // token từ storage) -> chưa vội kết luận là chưa login, tránh redirect nhầm
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Chưa đăng nhập -> đá về /login, kèm "from" để Login biết quay lại đúng
  // trang này sau khi đăng nhập thành công (đồng bộ pattern "from" đã dùng ở Home.tsx)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // Đã đăng nhập -> cho qua, render route con thật
  return <Outlet />;
};

export default PrivateRoute;

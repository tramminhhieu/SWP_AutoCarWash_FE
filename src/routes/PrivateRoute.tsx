import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Bọc các route cần đăng nhập (dùng dạng <Route element={<PrivateRoute />}> rồi
// nest các <Route> con bên trong - children sẽ render qua <Outlet />).
// Chưa đăng nhập -> redirect về /login, kèm "from" để Login biết quay lại
// đúng trang sau khi đăng nhập thành công (xử lý ở Login.tsx).
const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;

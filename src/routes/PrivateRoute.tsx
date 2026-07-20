import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/ui/Loading";
import Modal from "../components/ui/Modal";

// Bọc các route cần đăng nhập (dùng dạng <Route element={<PrivateRoute />}> rồi
// nest các <Route> con bên trong - children sẽ render qua <Outlet />).
// Chưa đăng nhập -> hiện popup thông báo, bấm "Log In" mới chuyển sang /login kèm
// "from" để Login biết quay lại đúng trang sau khi đăng nhập thành công.
const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Đang xác định trạng thái đăng nhập (vd vừa F5 trang, AuthContext đang đọc
  // token từ storage) -> chưa vội kết luận là chưa login, tránh redirect nhầm
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Chưa đăng nhập -> hiện popup, chỉ chuyển sang /login khi user xác nhận
  if (!isAuthenticated) {
    return (
      <Modal
        isOpen
        onClose={() => navigate("/")}
        variant="confirm"
        title="Login Required"
        message="You need to log in to perform this action."
        confirmText="Log In"
        cancelText="Cancel"
        onConfirm={() =>
          navigate("/login", {
            state: { from: location.pathname },
            replace: true,
          })
        }
      />
    );
  }
  // Đã đăng nhập -> cho qua, render route con thật
  return <Outlet />;
};

export default PrivateRoute;

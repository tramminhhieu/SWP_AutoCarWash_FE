// src/routes/RoleRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { RoleType } from "../features/auth/types/enums";

interface RoleRouteProps {
  allowedRoles: RoleType[]; // vd ["ADMIN"] hoặc ["STAFF", "ADMIN"]
}

// Trang chủ tương ứng từng role - dùng để đá user về đúng "nhà" của họ
// khi họ vào nhầm route không thuộc role mình
const HOME_PATH_BY_ROLE: Record<RoleType, string> = {
  CUSTOMER: "/",
  STAFF: "/staff",
  ADMIN: "/admin",
};

// RoleRoute luôn đặt LỒNG BÊN TRONG PrivateRoute (xem AppRouter.tsx), nên tại
// đây user chắc chắn đã đăng nhập - RoleRoute chỉ lo việc kiểm tra đúng role
const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuth();

  // Phòng hờ trường hợp user null (vd lỗi thứ tự bọc route) -> không cho qua
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role không nằm trong danh sách được phép cho route này -> đá thẳng về
  // trang chủ đúng role của họ, không cho thấy nội dung trang dù chỉ 1 khoảnh khắc
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={HOME_PATH_BY_ROLE[user.role]} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;

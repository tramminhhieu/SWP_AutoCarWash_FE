import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/booking/pages/SelectStation";
import BookingCreate from "../features/booking/pages/BookingCreate";
import BookingHistory from "../features/booking/pages/BookingHistory";
import BookingDetail from "../features/booking/pages/BookingDetail";
import VehicleAdd from "../features/customer/pages/VehicleAdd";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import ServicePackageList from "../features/servicepackage/pages/ServicePackageList";
import StaffHome from "../features/staff/pages/Home";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/servicePackages" element={<ServicePackageList />} />

        {/* Toàn bộ flow đặt lịch yêu cầu đăng nhập - bọc trong PrivateRoute,
            chưa login bấm vào sẽ bị redirect về /login (xử lý trong PrivateRoute.tsx) */}
        <Route element={<PrivateRoute />}>
          {/* Chỉ role CUSTOMER mới được dùng nhóm route này - STAFF/ADMIN login vào
              đây sẽ bị RoleRoute đá về đúng trang chủ role của họ */}
          <Route element={<RoleRoute allowedRoles={["CUSTOMER"]} />}>
            <Route path="/booking/location" element={<SelectStation />} />
            <Route path="/booking/details" element={<BookingCreate />} />
            <Route path="/booking/history" element={<BookingHistory />} />
            <Route
              path="/booking/history/:bookingId"
              element={<BookingDetail />}
            />
            <Route path="/vehicles/add" element={<VehicleAdd />} />
          </Route>
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={["STAFF"]} />}>
          <Route path="/staff" element={<StaffHome />} />
        </Route>
      </Route>

      {/* TODO: nhóm route ADMIN - tương tự STAFF, chưa có AdminLayout/page nào:
      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<...>} />
          </Route>
        </Route>
      </Route>
      */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/booking/pages/SelectStation";
import BookingCreate from "../features/booking/pages/BookingCreate";
import BookingHistory from "../features/booking/pages/BookingHistory";
import BookingDetail from "../features/booking/pages/BookingDetail";
import VehicleCreate from "../features/vehicles/pages/VehicleCreate";
import VehicleEdit from "../features/vehicles/pages/VehicleEdit";
import CustomerProfile from "../features/customer/pages/Profile";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import ServicePackageList from "../features/servicepackage/pages/ServicePackageList";
// ported from feature/FE-queue-management (working-tree only, chưa merge vào dev)
import StaffLayout from "../layouts/StaffLayout";
import QueuePage from "../features/queue/pages/QueuePage";
import WalkInPage from "../features/queue/pages/WalkInPage";
import PaymentPage from "../features/payment/pages/PaymentPage";
import ChangePassword from "../features/customer/pages/ChangePassword";
import LoyaltyRewards from "../features/customer/pages/LoyaltyRewards";
import AdminLayout from "../layouts/AdminLayout";
import AdminCustomers from "../features/adminCustomer/pages/AdminCustomers";

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
            <Route path="/vehicles/create" element={<VehicleCreate />} />
            <Route path="/vehicles/edit/:vehicleId" element={<VehicleEdit />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            <Route path="/customer/loyalty" element={<LoyaltyRewards />} />
            <Route
              path="/customer/profile/change-password"
              element={<ChangePassword />}
            />
          </Route>
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={["STAFF"]} />}>
          {/* Staff login về thẳng Queue, không qua dashboard placeholder nữa */}
          <Route
            path="/staff"
            element={<Navigate to="/staff/queue" replace />}
          />
          {/* ported from feature/FE-queue-management (working-tree only) */}
          <Route element={<StaffLayout />}>
            <Route path="/staff/queue" element={<QueuePage />} />
            <Route path="/staff/walk-in" element={<WalkInPage />} />
            <Route path="/staff/payment/:bookingId" element={<PaymentPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          {/* Admin login về thẳng Customer Management, không qua dashboard placeholder */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/customers" replace />}
          />
          <Route element={<AdminLayout />}>
            <Route path="/admin/customers" element={<AdminCustomers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

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
import ServicePackageList from "../features/servicepackage/pages/ServicePackageList";

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

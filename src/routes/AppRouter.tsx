import { Routes, Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/booking/pages/SelectStation";
import BookingCreate from "../features/booking/pages/BookingCreate";
import PrivateRoute from "./PrivateRoute";
import VehicleAdd from "../features/customer/pages/VehicleAdd";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Toàn bộ flow đặt lịch yêu cầu đăng nhập - bọc trong PrivateRoute,
            chưa login bấm vào sẽ bị redirect về /login (xử lý trong PrivateRoute.tsx) */}
        <Route element={<PrivateRoute />}>
          <Route path="/vehicles/add" element={<VehicleAdd />} />{" "}
          {/* thêm dòng này */}
          {/* Bước 1: chọn Location (Province -> Commune -> Station) */}
          <Route path="/booking/location" element={<SelectStation />} />
          {/* Bước 2: chọn dịch vụ/slot/addon/submit */}
          <Route path="/booking/details" element={<BookingCreate />} />
        </Route>
      </Route>
    </Routes>
  );
}

import { Routes, Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/booking/pages/SelectStation";
import BookingCreate from "../features/booking/pages/BookingCreate";
import BookingHistory from "../features/booking/pages/BookingHistory";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Bước 1: chọn Location (Province -> Commune -> Station) */}
        <Route path="/booking/location" element={<SelectStation />} />
        {/* Bước 2: chọn dịch vụ/slot/addon/submit (đang là placeholder, làm chi tiết ở task khác) */}
        <Route path="/booking/details" element={<BookingCreate />} />
      </Route>
      {/* BookingHistory đã có header/footer riêng nên để route đứng ngoài CustomerLayout, tránh lặp header */}
      <Route path="/booking/history" element={<BookingHistory />} />
    </Routes>
  );
}

import { Routes, Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/booking/pages/SelectStation";
import BookingCreate from "../features/booking/pages/BookingCreate";
/** Ngọc thêm version 1.0 */
import StaffLayout from "../layouts/StaffLayout";
import QueuePage from "../features/queue/pages/QueuePage";
import PaymentPage from "../features/payment/pages/PaymentPage";



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

      {/*/** Ngọc thêm version 1.0: Staff routes */}
      <Route element={<StaffLayout />}>
        <Route path="/staff/queue" element={<QueuePage />} />
        <Route path="/staff/payment/:bookingId" element={<PaymentPage />} />
      </Route>
    </Routes>
  );
}

import { Routes, Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/booking/pages/SelectStation";
import BookingCreate from "../features/booking/pages/BookingCreate";
import StaffLayout from "../layouts/StaffLayout";
import QueuePage from "../features/queue/pages/QueuePage";
import WalkInPage from "../features/queue/pages/WalkInPage";
import PaymentPage from "../features/payment/pages/PaymentPage";
import PrivateRoute from "./PrivateRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking/location" element={<SelectStation />} />
        <Route path="/booking/details" element={<BookingCreate />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff/queue" element={<QueuePage />} />
          <Route path="/staff/walk-in" element={<WalkInPage />} />
          <Route path="/staff/payment/:bookingId" element={<PaymentPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/booking/pages/SelectStation";
import BookingCreate from "../features/booking/pages/BookingCreate";
import BookingPayment from "../features/booking/pages/BookingPayment";
import TransactionHistory from "../features/transaction/pages/TransactionHistory";
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
// FE-53: Admin - Subscription Plan management
import AdminLayout from "../layouts/AdminLayout";
import SubscriptionPlanList from "../features/subscriptionplan/pages/SubscriptionPlanList";
import SubscriptionPlanTypeSelect from "../features/subscriptionplan/pages/SubscriptionPlanTypeSelect";
import SubscriptionPlanCreate from "../features/subscriptionplan/pages/SubscriptionPlanCreate";
import SubscriptionPlanEdit from "../features/subscriptionplan/pages/SubscriptionPlanEdit";
// Add-on service (chưa có AC/API chính thức - xem comment trong addonservice/)
import AddonServiceCreate from "../features/addonservice/pages/AddonServiceCreate";
// FE-60/56/58: Customer - browse/register/manage Subscription (khác admin CRUD ở trên).
// FE-59 (transfer vehicle) đã có sẵn trong CustomerProfile, không có route riêng.
import CustomerSubscriptionPlanList from "../features/subscription/pages/SubscriptionPlanList";
import SubscriptionRegister from "../features/subscription/pages/SubscriptionRegister";
import SubscriptionPayment from "../features/subscription/pages/SubscriptionPayment";
import MySubscriptions from "../features/subscription/pages/MySubscriptions";
// Admin - Transaction History + Customer management (từ origin/dev)
import AdminTransactionHistory from "../features/adminTransaction/pages/AdminTransactionHistory";
import AdminCustomers from "../features/adminCustomer/pages/AdminCustomers";
import AdminCustomerBookingHistory from "../features/adminCustomer/pages/AdminCustomerBookingHistory";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/servicePackages" element={<ServicePackageList />} />
        {/* FE-60-US-01: public, giống pattern /servicePackages - chưa login vẫn xem được,
            chỉ bắt login khi bấm Subscribe (xử lý trong SubscriptionPlanList.tsx) */}
        <Route
          path="/subscription-plans"
          element={<CustomerSubscriptionPlanList />}
        />

        {/* Toàn bộ flow đặt lịch yêu cầu đăng nhập - bọc trong PrivateRoute,
            chưa login bấm vào sẽ bị redirect về /login (xử lý trong PrivateRoute.tsx) */}
        <Route element={<PrivateRoute />}>
          {/* Chỉ role CUSTOMER mới được dùng nhóm route này - STAFF/ADMIN login vào
              đây sẽ bị RoleRoute đá về đúng trang chủ role của họ */}
          <Route element={<RoleRoute allowedRoles={["CUSTOMER"]} />}>
            <Route path="/booking/location" element={<SelectStation />} />
            <Route path="/booking/details" element={<BookingCreate />} />
            <Route
              path="/booking/payment/:bookingId"
              element={<BookingPayment />}
            />
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
              path="/customer/transactions"
              element={<TransactionHistory />}
            />
            <Route
              path="/customer/profile/change-password"
              element={<ChangePassword />}
            />
            {/* FE-60-US-02.1: chọn xe -> QR payment. FE-56: renew dùng chung route payment. */}
            <Route
              path="/subscription-plans/:planId/register"
              element={<SubscriptionRegister />}
            />
            <Route
              path="/subscription-plans/payment/:invoiceId"
              element={<SubscriptionPayment />}
            />
            {/* FE-60-US-05 + FE-58 + FE-56 entry point - khớp href "/subscription" đã có
                sẵn trong CustomerHeader NAV_LINKS ("My Subscription") */}
            <Route path="/subscription" element={<MySubscriptions />} />
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

      {/* FE-53: nhóm route ADMIN, theo đúng pattern STAFF ở trên */}
      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/subscription-plans" replace />}
          />
          <Route element={<AdminLayout />}>
            <Route
              path="/admin/subscription-plans"
              element={<SubscriptionPlanList />}
            />
            {/* Màn chọn loại (Unlimited/Family/Add-on) trước khi vào form tạo tương ứng */}
            <Route
              path="/admin/subscription-plans/create"
              element={<SubscriptionPlanTypeSelect />}
            />
            <Route
              path="/admin/subscription-plans/create/:type"
              element={<SubscriptionPlanCreate />}
            />
            <Route
              path="/admin/subscription-plans/:id/edit"
              element={<SubscriptionPlanEdit />}
            />
            <Route
              path="/admin/addon-services/create"
              element={<AddonServiceCreate />}
            />
            <Route
              path="/admin/transactions"
              element={<AdminTransactionHistory />}
            />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route
              path="/admin/customers/:customerId/bookings"
              element={<AdminCustomerBookingHistory />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

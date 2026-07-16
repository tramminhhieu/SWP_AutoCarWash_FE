import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../features/customer/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import SelectStation from "../features/station/components/SelectStation";
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
// ported from feature/FE-queue-management (working-tree only, chưa merge vào dev)
import StaffLayout from "../layouts/StaffLayout";
import QueuePage from "../features/queue/pages/QueuePage";
import WalkInPage from "../features/queue/pages/WalkInPage";
import PaymentPage from "../features/payment/pages/PaymentPage";
import ChangePassword from "../features/customer/pages/ChangePassword";
import LoyaltyRewards from "../features/customer/pages/LoyaltyRewards";
//Admin
import AdminLayout from "../layouts/AdminLayout";
import UnlimitedSubscriptionList from "../features/subscriptionPlan/pages/UnlimitedSubscriptionList";
import SubscriptionPlanCreate from "../features/subscriptionPlan/pages/SubscriptionPlanCreate";
import SubscriptionPlanEdit from "../features/subscriptionPlan/pages/SubscriptionPlanEdit";
import Dashboard from "../features/dashboard/pages/Dashboard";
// FE-60/56/58: Customer - browse/register/manage Subscription (khác admin CRUD ở trên).
// FE-59 (transfer vehicle) đã có sẵn trong CustomerProfile, không có route riêng.
import CustomerSubscriptionPlanList from "../features/subscription/pages/CustomerUnlimitedSubscriptionList";
import SubscriptionRegister from "../features/subscription/pages/SubscriptionRegister";
import SubscriptionPayment from "../features/subscription/pages/SubscriptionPayment";
import UnlimitedSubscription from "../features/subscription/pages/UnlimitedSubscription";
// API-17-01: Family Group - create + minimal detail landing page (AC08). Member CRUD (add/
// remove/edit) là task riêng, chưa làm ở đây.
import FamilyGroupDetail from "../features/familyGroup/pages/FamilyGroupDetail";
import FamilyGroupCreate from "../features/familyGroup/pages/FamilyGroupCreate";

// Add-on + Service Package (từ origin/dev) - thay thế addonservice/ cũ (mock)
import AddonList from "../features/addon/pages/AddonList";
import AddonCreate from "../features/addon/pages/AddonCreate";
import AddonEdit from "../features/addon/pages/AddonEdit";
import ServicePackageList from "../features/servicepackage/pages/ServicePackageList";
import ServicePackageCreate from "../features/servicepackage/pages/ServicePackageCreate";
import ServicePackageEdit from "../features/servicepackage/pages/ServicePackageEdit";
import WashLaneManagement from "../features/washlanes/pages/WashLaneManagement";
import PromotionOverview from "../features/promotion/pages/PromotionOverview";
import PromotionDetail from "../features/promotion/pages/PromotionDetail";
import PromotionCreate from "../features/promotion/pages/PromotionCreate";
import PromotionEdit from "../features/promotion/pages/PromotionEdit";
// Admin - Transaction History + Customer management (từ origin/dev)
import AdminTransactionHistory from "../features/adminTransaction/pages/AdminTransactionHistory";
import AdminCustomers from "../features/adminCustomer/pages/AdminCustomers";
import AdminCustomerBookingHistory from "../features/adminCustomer/pages/AdminCustomerBookingHistory";
import SystemSettingList from "../features/systemSetting/pages/SystemSettingList";
import SystemSettingCreate from "../features/systemSetting/pages/SystemSettingCreate";
import SystemSettingEdit from "../features/systemSetting/pages/SystemSettingEdit";
import RefundManagement from "../features/refund/pages/RefundManagement";
import FamilySubscriptionList from "../features/subscriptionPlan/pages/FamilySubscriptionList";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add-ons" element={<AddonList />} />
        <Route path="/service-packages" element={<ServicePackageList />} />
        {/* FE-60-US-01: public, chưa login vẫn xem được, chỉ bắt login khi bấm Subscribe
            (xử lý trong SubscriptionPlanList.tsx) */}
        <Route
          path="/subscription-plans"
          element={<CustomerSubscriptionPlanList />}
        />
        <Route
          path="/subscriptions/family/plans"
          element={<FamilySubscriptionList />}
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
            <Route path="/vehicles/:vehicleId/edit" element={<VehicleEdit />} />
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
            <Route path="/unlimited" element={<UnlimitedSubscription />} />
            {/* API-17-01: khớp href "/family" đã có sẵn trong CustomerHeader NAV_LINKS
                ("My Family") */}
            <Route path="/family" element={<FamilyGroupDetail />} />
            <Route path="/family/create" element={<FamilyGroupCreate />} />
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
            <Route path="/staff/customers" element={<AdminCustomers />} />
            <Route
              path="/staff/customers/:customerId/bookings"
              element={<AdminCustomerBookingHistory />}
            />
            <Route
              path="/staff/transactions"
              element={<AdminTransactionHistory />}
            />
            <Route path="/staff/dashboards" element={<Dashboard />} />
          </Route>
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          {/* Admin login về thẳng Dashboard */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboards" replace />}
          />
          <Route element={<AdminLayout />}>
            <Route path="/admin/add-ons" element={<AddonList />} />
            <Route path="/admin/add-ons/create" element={<AddonCreate />} />
            <Route
              path="/admin/add-ons/:addonId/edit"
              element={<AddonEdit />}
            />

            <Route
              path="/admin/service-packages"
              element={<ServicePackageList />}
            />
            <Route
              path="/admin/service-packages/create"
              element={<ServicePackageCreate />}
            />
            <Route
              path="/admin/service-packages/:servicePackageId/edit"
              element={<ServicePackageEdit />}
            />

            <Route
              path="/admin/unlimited-subscriptions"
              element={<UnlimitedSubscriptionList />}
            />
            <Route
              path="/admin/subscription-plans/:type/create"
              element={<SubscriptionPlanCreate />}
            />
            <Route
              path="/admin/subscription-plans/:type/:id/edit"
              element={<SubscriptionPlanEdit />}
            />
            <Route path="/admin/wash-lanes" element={<WashLaneManagement />} />
            <Route path="/admin/promotions" element={<PromotionOverview />} />
            <Route
              path="/admin/promotions/station/:stationId"
              element={<PromotionDetail />}
            />
            <Route
              path="/admin/promotions/create"
              element={<PromotionCreate />}
            />
            <Route
              path="/admin/promotions/:promotionId/edit"
              element={<PromotionEdit />}
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
            <Route
              path="/admin/system-settings"
              element={<SystemSettingList />}
            />
            <Route
              path="/admin/system-settings/new"
              element={<SystemSettingCreate />}
            />
            <Route
              path="/admin/system-settings/:systemSettingId/edit"
              element={<SystemSettingEdit />}
            />
            <Route path="/admin/refunds" element={<RefundManagement />} />
            <Route
              path="/admin/family-subscriptions"
              element={<FamilySubscriptionList />}
            />
            <Route path="/admin/dashboards" element={<Dashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

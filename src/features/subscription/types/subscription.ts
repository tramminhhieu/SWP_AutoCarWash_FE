// Customer-facing subscription (khác admin CRUD ở src/features/subscriptionplan/).
// Khớp FE-60 / FE-56 / FE-58 (Note.md) + bảng subscription_plan / unlimit_subscription
// thật trong data.sql. FE-59 (transfer vehicle) đã có sẵn trong Profile.tsx, không lặp lại ở đây.
export type PlanType = "FAMILY" | "UNLIMITED";

// FE-60-US-01: GET /api/customer/subscription-plans
export interface CustomerSubscriptionPlan {
  // Note.md không show id trong response mẫu, nhưng cần id thật để gọi Register -
  // cùng gap đã báo Nora ở list admin (FE-53), giả định BE cũng trả kèm id ở đây.
  id: number;
  planName: string;
  price: number;
  durationDays: number;
  planType: PlanType;
  description: string;
  servicePackageName: string;
  maxVehicleCount: number | null;
}

// Vehicle để chọn khi đăng ký - dùng lại CustomerVehicle từ profile (đã có sẵn, có
// activeSubscription để biết xe nào đang bận gói), không mock riêng 1 API vehicles nữa.
export interface RegisterVehicleOption {
  id: number;
  licensePlate: string;
  vehicleName: string;
  hasActiveSubscription: boolean;
}

// FE-60-US-02.1 step 2: POST /api/customer/unlimited-subscriptions
export interface RegisterUnlimitedRequest {
  subscriptionPlanId: number;
  vehicleId: number;
}
export interface RegisterUnlimitedResult {
  subscriptionId: number;
  invoiceId: number;
  status: "PENDING";
}

// FE-60-US-02.1 step 3: GET /api/customer/subscription-invoices/{invoiceId}/payment
export interface SubscriptionPaymentInfo {
  invoiceId: number;
  finalAmount: number;
  qrCode: string;
  expiredAt: string; // ISO datetime
  planName: string;
  // Không có trong Note.md - FE tự thêm để phân biệt copy "Payment successful" giữa
  // đăng ký mới và gia hạn (dùng chung 1 màn QR cho cả 2 luồng, xem SubscriptionPayment.tsx)
  isRenewal: boolean;
}

// FE-58-US-01 AC03 dùng "CANCELED" (chính tả Mỹ, 1 chữ L) - khớp với BookingStatus/
// bookingStatusStyles.ts đã dùng sẵn trong codebase, trước đó type này lỡ gõ "CANCELLED".
export type UnlimitedSubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELED";

// FE-60-US-05: GET /api/customer/unlimited-subscriptions
export interface UnlimitedSubscription {
  id: number;
  // planId để renew() tra cứu lại đúng plan gốc - tránh match theo planName (dễ vỡ nếu admin
  // đổi tên plan sau này). Không có trong response mẫu của Note.md nhưng cần thiết cho FE.
  planId: number;
  planName: string;
  servicePackageName: string;
  planType: PlanType;
  status: UnlimitedSubscriptionStatus;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  durationDays: number;
  price: number;
  vehicle: { id: number; licensePlate: string; vehicleName: string };
  description: string;
  // Số xe tối đa của gói (chỉ có ý nghĩa với FAMILY) - cần để hiện "Slots Used X/Y" ở màn
  // quản lý Family Group (FamilyGroupManage.tsx) mà không phải gọi thêm API lấy lại plan.
  maxVehicleCount: number;
}

export const SUBSCRIPTION_ERROR_CODES = {
  VEHICLE_REQUIRED: "VEHICLE_REQUIRED",
  VEHICLE_ALREADY_SUBSCRIBED: "VEHICLE_ALREADY_SUBSCRIBED",
  INVALID_SUBSCRIPTION_PLAN: "INVALID_SUBSCRIPTION_PLAN",
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION_NOT_FOUND",
  INVALID_SUBSCRIPTION_STATUS: "INVALID_SUBSCRIPTION_STATUS",
  ACCESS_DENIED: "ACCESS_DENIED",
} as const;

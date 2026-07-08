import { getCustomerProfile } from "../../customer/api/profileApi";
import type {
  CustomerSubscriptionPlan,
  PlanType,
  RegisterUnlimitedResult,
  RegisterVehicleOption,
  SubscriptionPaymentInfo,
  UnlimitedSubscription,
} from "../types/subscription";
import { SUBSCRIPTION_ERROR_CODES } from "../types/subscription";

// ⚠️ MOCK DATA - Note.md chưa có BE thật cho nhóm API customer/subscription-*
// (renew endpoint còn để trống hoàn toàn trong note). Toàn bộ state chỉ tồn tại trong bộ
// nhớ trình duyệt (mất khi F5). Data mẫu lấy đúng 12 dòng trong bảng subscription_plan
// thật (data.sql) - id 1-12, service_package_id 1/3 = Basic/Premium.
interface MockPlan {
  id: number;
  planName: string;
  price: number;
  durationDays: number;
  planType: PlanType;
  servicePackageName: string;
  maxVehicleCount: number;
  description: string;
}

const MOCK_PLANS: MockPlan[] = [
  { id: 1, planName: "Unlimited Basic 1 Month", price: 500000, durationDays: 30, planType: "UNLIMITED", servicePackageName: "Basic", maxVehicleCount: 1, description: "Unlimited car wash for 1 month." },
  { id: 2, planName: "Unlimited Premium 1 Month", price: 900000, durationDays: 30, planType: "UNLIMITED", servicePackageName: "Premium", maxVehicleCount: 1, description: "Unlimited premium car wash for 1 month." },
  { id: 3, planName: "Unlimited Basic 3 Months", price: 1350000, durationDays: 90, planType: "UNLIMITED", servicePackageName: "Basic", maxVehicleCount: 1, description: "Unlimited car wash for 3 months." },
  { id: 4, planName: "Unlimited Premium 3 Months", price: 2400000, durationDays: 90, planType: "UNLIMITED", servicePackageName: "Premium", maxVehicleCount: 1, description: "Unlimited premium car wash for 3 months." },
  { id: 5, planName: "Unlimited Premium 6 Months", price: 4800000, durationDays: 180, planType: "UNLIMITED", servicePackageName: "Premium", maxVehicleCount: 1, description: "Unlimited premium car wash for 6 months." },
  { id: 6, planName: "Family Basic 1 Month", price: 1200000, durationDays: 30, planType: "FAMILY", servicePackageName: "Basic", maxVehicleCount: 3, description: "Unlimited wash for the whole family, 1 month." },
  { id: 7, planName: "Family Premium 1 Month", price: 2000000, durationDays: 30, planType: "FAMILY", servicePackageName: "Premium", maxVehicleCount: 3, description: "Premium wash for the whole family, 1 month." },
  { id: 8, planName: "Family Basic 3 Months", price: 3200000, durationDays: 90, planType: "FAMILY", servicePackageName: "Basic", maxVehicleCount: 4, description: "Unlimited wash for the whole family, 3 months." },
  { id: 9, planName: "Family Premium 3 Months", price: 5400000, durationDays: 90, planType: "FAMILY", servicePackageName: "Premium", maxVehicleCount: 4, description: "Premium wash for the whole family, 3 months." },
  { id: 10, planName: "Family Premium 6 Months", price: 10800000, durationDays: 180, planType: "FAMILY", servicePackageName: "Premium", maxVehicleCount: 5, description: "Premium wash for the whole family, 6 months." },
  { id: 11, planName: "Unlimited Basic 6 Months", price: 2700000, durationDays: 180, planType: "UNLIMITED", servicePackageName: "Basic", maxVehicleCount: 1, description: "Unlimited car wash for 6 months." },
  { id: 12, planName: "Family Basic 6 Months", price: 6500000, durationDays: 180, planType: "FAMILY", servicePackageName: "Basic", maxVehicleCount: 3, description: "Unlimited wash for the whole family, 6 months." },
];

// Fallback vehicle list khi getCustomerProfile() (API thật) lỗi/chưa có BE chạy -
// để vẫn demo được luồng đăng ký mà không cần BE.
const FALLBACK_VEHICLES: RegisterVehicleOption[] = [
  { id: 1, licensePlate: "65A-12345", vehicleName: "Toyota Vios", hasActiveSubscription: false },
  { id: 2, licensePlate: "65B-67890", vehicleName: "Honda City", hasActiveSubscription: false },
];

interface MockInvoice {
  id: number;
  planId: number;
  vehicleId: number;
  finalAmount: number;
  status: "PENDING" | "PAID";
  isRenewal: boolean;
  renewSubscriptionId?: number;
}

let mockInvoices: MockInvoice[] = [];
let nextInvoiceId = 100;
let nextSubscriptionId = 100;

// Xe đang có 1 invoice PENDING chưa thanh toán - chặn đăng ký lần 2 cho cùng xe trong lúc
// invoice trước còn treo (tránh double-book trước khi payment confirm/thất bại/hết hạn).
const pendingVehicleIds = new Set<number>();

// Data mẫu "My Subscriptions" - lấy đúng theo bảng unlimit_subscription thật (data.sql,
// id 1 và 6 - ACTIVE), gắn với plan/vehicle mock ở trên. planId trỏ lại đúng MOCK_PLANS
// để renew() tra cứu theo id thay vì so planName (dễ vỡ nếu tên plan bị đổi).
let mockSubscriptions: UnlimitedSubscription[] = [
  {
    id: 1,
    planId: 1,
    planName: "Unlimited Basic 1 Month",
    servicePackageName: "Basic",
    planType: "UNLIMITED",
    status: "ACTIVE",
    startDate: "2026-06-08",
    // Cố tình để gần hết hạn (2 ngày, trong ngưỡng cảnh báo BL-SP-07) để Nora thấy ngay
    // banner "Expires in X days" trên MySubscriptions.tsx mà không cần tự sửa data.
    endDate: "2026-07-10",
    durationDays: 30,
    price: 500000,
    vehicle: { id: 1, licensePlate: "65A-12345", vehicleName: "Toyota Vios" },
    description: "Unlimited car wash for 1 month.",
    maxVehicleCount: 1,
  },
  {
    id: 6,
    planId: 6,
    planName: "Family Basic 1 Month",
    servicePackageName: "Basic",
    planType: "FAMILY",
    status: "EXPIRED",
    startDate: "2026-05-08",
    endDate: "2026-06-07",
    durationDays: 30,
    price: 1200000,
    vehicle: { id: 2, licensePlate: "65B-67890", vehicleName: "Honda City" },
    description: "Unlimited wash for the whole family, 1 month.",
    maxVehicleCount: 3,
  },
  // Thêm 1 gói Family đang ACTIVE (data.sql chỉ cho 1 gói family mẫu ở trên nhưng đã set
  // EXPIRED để test luồng Renew) - cần thêm bản ACTIVE để có chỗ test màn Family Group
  // Manage (chỉ mở được khi status ACTIVE). Dùng plan id 9 "Family Premium 3 Months".
  {
    id: 9,
    planId: 9,
    planName: "Family Premium 3 Months",
    servicePackageName: "Premium",
    planType: "FAMILY",
    status: "ACTIVE",
    startDate: "2026-06-20",
    endDate: "2026-09-18",
    durationDays: 90,
    price: 5400000,
    vehicle: { id: 3, licensePlate: "65C-11111", vehicleName: "Mazda CX-5" },
    description: "Premium wash for the whole family, 3 months.",
    maxVehicleCount: 4,
  },
];

const delay = <T,>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const rejectWith = (message: string, errorCode: string) =>
  Promise.reject({ response: { data: { success: false, message, errorCode } } });

// FE-60-US-01
export const getPlans = (): Promise<CustomerSubscriptionPlan[]> => delay(MOCK_PLANS);

export const getPlanById = (id: number): Promise<CustomerSubscriptionPlan | undefined> =>
  delay(MOCK_PLANS.find((p) => p.id === id));

// Vehicle list cho bước chọn xe khi đăng ký - ưu tiên API thật (đã có sẵn ở profile),
// fallback sang mock khi chưa có BE chạy để vẫn demo được UI.
export const getVehicleOptions = async (): Promise<RegisterVehicleOption[]> => {
  try {
    const res = await getCustomerProfile();
    return res.data.vehicles.map((v) => ({
      id: v.id,
      licensePlate: v.licensePlate,
      vehicleName: v.brandName,
      hasActiveSubscription: !!v.activeSubscription,
    }));
  } catch {
    return delay(FALLBACK_VEHICLES);
  }
};

// FE-60-US-02.1 step 2: POST /api/customer/unlimited-subscriptions
export const register = (
  subscriptionPlanId: number,
  vehicleId: number,
  vehicleAlreadySubscribed: boolean,
): Promise<RegisterUnlimitedResult> => {
  if (!vehicleId) {
    return rejectWith("Vehicle is required.", SUBSCRIPTION_ERROR_CODES.VEHICLE_REQUIRED);
  }

  // BL-SP-01: nếu xe đang có ĐÚNG gói này (cùng planId) còn ACTIVE, hệ thống phải tự gia
  // hạn thay vì tạo Subscription ACTIVE mới - không reject như 1 lần đăng ký khác gói.
  // Chỉ tra được trong mockSubscriptions (nguồn dữ liệu subscription duy nhất FE mock có) -
  // vehicleAlreadySubscribed ở dưới đến từ API profile THẬT nên có thể không khớp id xe mock
  // khi Nora test bằng dữ liệu backend thật (2 nguồn dữ liệu tách biệt, giới hạn đã biết của
  // kiến trúc hybrid real+mock hiện tại - xem thêm getVehicleOptions()).
  const existingSameActive = mockSubscriptions.find(
    (s) =>
      s.vehicle.id === vehicleId &&
      s.planId === subscriptionPlanId &&
      s.status === "ACTIVE",
  );
  if (existingSameActive) {
    return renew(existingSameActive.id);
  }

  if (vehicleAlreadySubscribed) {
    return rejectWith(
      "The vehicle is already registered with another subscription plan.",
      SUBSCRIPTION_ERROR_CODES.VEHICLE_ALREADY_SUBSCRIBED,
    );
  }
  if (pendingVehicleIds.has(vehicleId)) {
    return rejectWith(
      "This vehicle already has a pending subscription payment.",
      SUBSCRIPTION_ERROR_CODES.VEHICLE_ALREADY_SUBSCRIBED,
    );
  }
  const plan = MOCK_PLANS.find((p) => p.id === subscriptionPlanId);
  if (!plan) {
    return rejectWith(
      "Invalid subscription plan.",
      SUBSCRIPTION_ERROR_CODES.INVALID_SUBSCRIPTION_PLAN,
    );
  }

  const invoiceId = nextInvoiceId++;
  mockInvoices = [
    ...mockInvoices,
    { id: invoiceId, planId: plan.id, vehicleId, finalAmount: plan.price, status: "PENDING", isRenewal: false },
  ];
  pendingVehicleIds.add(vehicleId);

  return delay({ subscriptionId: nextSubscriptionId++, invoiceId, status: "PENDING" as const });
};

// FE-56-US-02: gia hạn - Note.md để trống API, tự dựng theo đúng pattern của register
// (tạo invoice mới, dùng chung màn QR payment) vì AC mô tả logic tương tự.
export const renew = (subscriptionId: number): Promise<RegisterUnlimitedResult> => {
  const sub = mockSubscriptions.find((s) => s.id === subscriptionId);
  if (!sub) {
    return rejectWith("Subscription not found.", SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
  }
  // FE-56-US-02 AC03: từ chối gia hạn nếu subscription đã hết hạn hoặc không còn ACTIVE
  // (EXPIRED/CANCELED không được renew - khách phải đăng ký lại gói mới qua Browse Plans).
  if (sub.status !== "ACTIVE") {
    return rejectWith(
      "This subscription is no longer active and cannot be renewed.",
      SUBSCRIPTION_ERROR_CODES.INVALID_SUBSCRIPTION_STATUS,
    );
  }
  // Tra theo planId (không so planName - dễ vỡ nếu admin đổi tên plan sau này)
  const plan = MOCK_PLANS.find((p) => p.id === sub.planId);
  if (!plan) {
    return rejectWith(
      "The original plan for this subscription is no longer available.",
      SUBSCRIPTION_ERROR_CODES.INVALID_SUBSCRIPTION_PLAN,
    );
  }
  const invoiceId = nextInvoiceId++;
  mockInvoices = [
    ...mockInvoices,
    {
      id: invoiceId,
      planId: plan.id,
      vehicleId: sub.vehicle.id,
      finalAmount: sub.price,
      status: "PENDING",
      isRenewal: true,
      renewSubscriptionId: subscriptionId,
    },
  ];
  return delay({ subscriptionId, invoiceId, status: "PENDING" as const });
};

// FE-60-US-02.1 step 3: GET /api/customer/subscription-invoices/{invoiceId}/payment
export const getPaymentInfo = (invoiceId: number): Promise<SubscriptionPaymentInfo> => {
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    return rejectWith("Invoice not found.", "INVOICE_NOT_FOUND");
  }
  const plan = MOCK_PLANS.find((p) => p.id === invoice.planId);
  const qrData = encodeURIComponent(`AutoCarWash|invoice=${invoiceId}|amount=${invoice.finalAmount}`);
  return delay({
    invoiceId,
    finalAmount: invoice.finalAmount,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}`,
    expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    planName: plan?.planName ?? "Subscription",
    isRenewal: invoice.isRenewal,
  });
};

// Không có trong Note.md (chưa tích hợp cổng thanh toán thật) - nút "Simulate Payment"
// trên trang QR gọi hàm này để giả lập webhook thanh toán thành công, dùng để demo/test
// hết luồng FE-60-US-02.1 + FE-56-US-05 mà không cần cổng thanh toán thật.
export const simulatePaymentSuccess = (invoiceId: number): Promise<{ success: boolean }> => {
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  if (!invoice) return delay({ success: false });
  invoice.status = "PAID";
  // Payment resolved (success) - xe không còn "đang chờ thanh toán" nữa, mở lại cho phép
  // đăng ký/gia hạn lần sau. Không clear thì xe bị kẹt "pending" vĩnh viễn sau lần đầu.
  pendingVehicleIds.delete(invoice.vehicleId);

  const plan = MOCK_PLANS.find((p) => p.id === invoice.planId);
  const vehicle =
    getVehicleFromMockOrSubscription(invoice.vehicleId) ??
    { id: invoice.vehicleId, licensePlate: "—", vehicleName: "Vehicle" };

  if (invoice.isRenewal && invoice.renewSubscriptionId) {
    // FE-56-US-05: gia hạn thành công -> cộng thêm durationDays vào endDate hiện tại
    mockSubscriptions = mockSubscriptions.map((s) => {
      if (s.id !== invoice.renewSubscriptionId) return s;
      const base = new Date(s.endDate) > new Date() ? new Date(s.endDate) : new Date();
      base.setDate(base.getDate() + (plan?.durationDays ?? 30));
      return { ...s, status: "ACTIVE", endDate: base.toISOString().slice(0, 10) };
    });
  } else if (plan) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);
    mockSubscriptions = [
      ...mockSubscriptions,
      {
        id: nextSubscriptionId++,
        planId: plan.id,
        planName: plan.planName,
        servicePackageName: plan.servicePackageName,
        planType: plan.planType,
        status: "ACTIVE",
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        durationDays: plan.durationDays,
        price: plan.price,
        vehicle,
        description: plan.description,
        maxVehicleCount: plan.maxVehicleCount,
      },
    ];
  }

  return delay({ success: true });
};

function getVehicleFromMockOrSubscription(vehicleId: number) {
  return (
    FALLBACK_VEHICLES.find((v) => v.id === vehicleId) ??
    mockSubscriptions.find((s) => s.vehicle.id === vehicleId)?.vehicle
  );
}

// FE-60-US-05: GET /api/customer/unlimited-subscriptions
export const getMySubscriptions = (): Promise<UnlimitedSubscription[]> =>
  delay([...mockSubscriptions]);

// FE-58-US-01: PATCH /api/customer/unlimited-subscriptions/{id}/cancel
export const cancel = (id: number): Promise<{ success: true; message: string }> => {
  const sub = mockSubscriptions.find((s) => s.id === id);
  if (!sub) {
    return rejectWith("Subscription not found.", SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
  }
  if (sub.status !== "ACTIVE") {
    return rejectWith(
      "Only active subscriptions can be canceled.",
      SUBSCRIPTION_ERROR_CODES.INVALID_SUBSCRIPTION_STATUS,
    );
  }
  mockSubscriptions = mockSubscriptions.map((s) =>
    s.id === id ? { ...s, status: "CANCELED" } : s,
  );
  return delay({ success: true, message: "Subscription canceled successfully." });
};

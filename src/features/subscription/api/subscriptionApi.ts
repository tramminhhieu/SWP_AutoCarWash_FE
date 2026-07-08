import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import { getCustomerProfile } from "../../customer/api/profileApi";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  CustomerSubscriptionPlan,
  PlanType,
  RegisterUnlimitedResult,
  RegisterVehicleOption,
  SubscriptionPaymentInfo,
  UnlimitedSubscription,
} from "../types/subscription";
import { SUBSCRIPTION_ERROR_CODES } from "../types/subscription";

// getPlans/getPlanById/register/getMySubscriptions/cancel dưới đây đã gọi API thật.
// renew/getPaymentInfo/simulatePaymentSuccess VẪN LÀ MOCK - BE xác nhận (2026-07-08) là
// chưa build FE-56-US-02 (renew) lẫn FE-56-US-05 (hoàn tất gia hạn/xác nhận thanh toán QR),
// xem BE_API_GAPS_Subscription.md mục 4/3. MOCK_PLANS/mockInvoices/mockSubscriptions dưới
// đây chỉ còn phục vụ 3 hàm mock đó - không còn là nguồn dữ liệu cho phần đã wire thật.
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
  { id: 1, planName: "Unlimited Basic 1 Month", price: 500000, durationDays: 30, planType: "UNLIMIT", servicePackageName: "Basic", maxVehicleCount: 1, description: "Unlimited car wash for 1 month." },
  { id: 2, planName: "Unlimited Premium 1 Month", price: 900000, durationDays: 30, planType: "UNLIMIT", servicePackageName: "Premium", maxVehicleCount: 1, description: "Unlimited premium car wash for 1 month." },
  { id: 3, planName: "Unlimited Basic 3 Months", price: 1350000, durationDays: 90, planType: "UNLIMIT", servicePackageName: "Basic", maxVehicleCount: 1, description: "Unlimited car wash for 3 months." },
  { id: 4, planName: "Unlimited Premium 3 Months", price: 2400000, durationDays: 90, planType: "UNLIMIT", servicePackageName: "Premium", maxVehicleCount: 1, description: "Unlimited premium car wash for 3 months." },
  { id: 5, planName: "Unlimited Premium 6 Months", price: 4800000, durationDays: 180, planType: "UNLIMIT", servicePackageName: "Premium", maxVehicleCount: 1, description: "Unlimited premium car wash for 6 months." },
  { id: 6, planName: "Family Basic 1 Month", price: 1200000, durationDays: 30, planType: "FAMILY", servicePackageName: "Basic", maxVehicleCount: 3, description: "Unlimited wash for the whole family, 1 month." },
  { id: 7, planName: "Family Premium 1 Month", price: 2000000, durationDays: 30, planType: "FAMILY", servicePackageName: "Premium", maxVehicleCount: 3, description: "Premium wash for the whole family, 1 month." },
  { id: 8, planName: "Family Basic 3 Months", price: 3200000, durationDays: 90, planType: "FAMILY", servicePackageName: "Basic", maxVehicleCount: 4, description: "Unlimited wash for the whole family, 3 months." },
  { id: 9, planName: "Family Premium 3 Months", price: 5400000, durationDays: 90, planType: "FAMILY", servicePackageName: "Premium", maxVehicleCount: 4, description: "Premium wash for the whole family, 3 months." },
  { id: 10, planName: "Family Premium 6 Months", price: 10800000, durationDays: 180, planType: "FAMILY", servicePackageName: "Premium", maxVehicleCount: 5, description: "Premium wash for the whole family, 6 months." },
  { id: 11, planName: "Unlimited Basic 6 Months", price: 2700000, durationDays: 180, planType: "UNLIMIT", servicePackageName: "Basic", maxVehicleCount: 1, description: "Unlimited car wash for 6 months." },
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
  vehicleId: number;
  finalAmount: number;
  planName: string;
  status: "PENDING" | "PAID";
  isRenewal: boolean;
  renewSubscriptionId?: number;
}

let mockInvoices: MockInvoice[] = [];
let nextInvoiceId = 100;

// Data mẫu chỉ còn dùng nội bộ cho renew() (mock) tra cứu "subscription hiện tại" - KHÔNG
// còn phản ánh dữ liệu thật hiển thị trên MySubscriptions (đã wire getMySubscriptions() thật
// ở dưới). Vì vậy renew() trên 1 subscription id THẬT từ BE sẽ luôn rơi vào nhánh "not found"
// bên dưới (xem comment tại renew()).
let mockSubscriptions: UnlimitedSubscription[] = [
  {
    id: 1,
    planId: 1,
    planName: "Unlimited Basic 1 Month",
    servicePackageName: "Basic",
    planType: "UNLIMIT",
    status: "ACTIVE",
    startDate: "2026-06-08",
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

// FE-60-US-01: GET /api/customer/subscription-plans
export const getPlans = async (): Promise<CustomerSubscriptionPlan[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<CustomerSubscriptionPlan[]>>(
    API.CUSTOMER.SUBSCRIPTION_PLAN.LIST,
  );
  return res.data.data;
};

// Không có endpoint detail riêng cho customer (spec chỉ có list) - tra trong kết quả getPlans().
export const getPlanById = async (
  id: number,
): Promise<CustomerSubscriptionPlan | undefined> => {
  const plans = await getPlans();
  return plans.find((p) => p.id === id);
};

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
export const register = async (
  subscriptionPlanId: number,
  vehicleId: number,
  vehicleAlreadySubscribed: boolean,
): Promise<RegisterUnlimitedResult> => {
  if (!vehicleId) {
    return rejectWith("Vehicle is required.", SUBSCRIPTION_ERROR_CODES.VEHICLE_REQUIRED);
  }
  if (vehicleAlreadySubscribed) {
    return rejectWith(
      "The vehicle is already registered with another subscription plan.",
      SUBSCRIPTION_ERROR_CODES.VEHICLE_ALREADY_SUBSCRIBED,
    );
  }

  const res = await axiosClient.post<ApiSuccessResponse<RegisterUnlimitedResult>>(
    API.CUSTOMER.UNLIMITED_SUBSCRIPTION.CREATE,
    { subscriptionPlanId, vehicleId },
  );
  const result = res.data.data;

  // getPaymentInfo/simulatePaymentSuccess (dưới đây) vẫn mock vì BE chưa có API xác nhận
  // thanh toán QR - cache lại invoice bằng đúng invoiceId thật BE vừa trả, dùng giá/tên gói
  // thật (getPlanById cũng đã là API thật) để màn QR vẫn hiển thị đúng số tiền cho tới khi BE
  // có endpoint xác nhận thanh toán thật.
  const plan = await getPlanById(subscriptionPlanId);
  mockInvoices = [
    ...mockInvoices,
    {
      id: result.invoiceId,
      vehicleId,
      finalAmount: plan?.price ?? 0,
      planName: plan?.planName ?? "Subscription",
      status: "PENDING",
      isRenewal: false,
    },
  ];

  return result;
};

// FE-56-US-02: ⚠️ MOCK - BE xác nhận (2026-07-08) CHƯA build API renew.
export const renew = (subscriptionId: number): Promise<RegisterUnlimitedResult> => {
  const sub = mockSubscriptions.find((s) => s.id === subscriptionId);
  if (!sub) {
    // getMySubscriptions() (trên) đã trả dữ liệu THẬT từ BE - id subscription hiển thị trên
    // UI sẽ không khớp id giả (1/6/9) trong seed mock này nên luôn rơi vào nhánh này. Dùng
    // message phản ánh đúng "tính năng chưa sẵn sàng", không phải "không tìm thấy gói" (dễ
    // hiểu nhầm là bug) - MySubscriptions.tsx handleRenew tự hiển thị message này.
    return rejectWith(
      "Renewal isn't available yet - please check back soon.",
      "RENEWAL_NOT_YET_AVAILABLE",
    );
  }
  // FE-56-US-02 AC03: từ chối gia hạn nếu subscription đã hết hạn hoặc không còn ACTIVE
  // (EXPIRED/CANCELED không được renew - khách phải đăng ký lại gói mới qua Browse Plans).
  if (sub.status !== "ACTIVE") {
    return rejectWith(
      "This subscription is no longer active and cannot be renewed.",
      SUBSCRIPTION_ERROR_CODES.INVALID_SUBSCRIPTION_STATUS,
    );
  }
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
      vehicleId: sub.vehicle.id,
      finalAmount: sub.price,
      planName: plan.planName,
      status: "PENDING",
      isRenewal: true,
      renewSubscriptionId: subscriptionId,
    },
  ];
  return delay({ subscriptionId, invoiceId, status: "PENDING" as const });
};

// FE-60-US-02.1 step 3: GET /api/customer/subscription-invoices/{invoiceId}/payment
// ⚠️ MOCK - BE chưa có API polling/webhook xác nhận thanh toán QR.
export const getPaymentInfo = (invoiceId: number): Promise<SubscriptionPaymentInfo> => {
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    return rejectWith("Invoice not found.", "INVOICE_NOT_FOUND");
  }
  const qrData = encodeURIComponent(`AutoCarWash|invoice=${invoiceId}|amount=${invoice.finalAmount}`);
  return delay({
    invoiceId,
    finalAmount: invoice.finalAmount,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}`,
    expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    planName: invoice.planName,
    isRenewal: invoice.isRenewal,
  });
};

// ⚠️ MOCK - không có endpoint thật để BE báo thanh toán thành công. Nút "Simulate Payment"
// trên màn QR gọi hàm này để demo/test hết luồng UI - chỉ đánh dấu invoice cục bộ là PAID để
// hiện màn "Payment successful", KHÔNG tạo/sửa subscription thật nào - subscription thật (nếu
// có) chỉ xuất hiện trên MySubscriptions khi BE thật sự xác nhận thanh toán.
export const simulatePaymentSuccess = (invoiceId: number): Promise<{ success: boolean }> => {
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  if (!invoice) return delay({ success: false });
  invoice.status = "PAID";
  return delay({ success: true });
};

// FE-60-US-05: GET /api/customer/unlimited-subscriptions
export const getMySubscriptions = async (): Promise<UnlimitedSubscription[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<UnlimitedSubscription[]>>(
    API.CUSTOMER.UNLIMITED_SUBSCRIPTION.LIST,
  );
  return res.data.data;
};

// FE-58-US-01: PATCH /api/customer/unlimited-subscriptions/{id}/cancel
export const cancel = async (id: number): Promise<{ success: true; message: string }> => {
  const res = await axiosClient.patch<ApiSuccessResponse<unknown>>(
    API.CUSTOMER.UNLIMITED_SUBSCRIPTION.CANCEL(id),
  );
  return res.data;
};

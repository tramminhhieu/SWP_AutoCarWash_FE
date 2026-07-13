import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import { getCustomerProfile } from "../../customer/api/profileApi";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  CustomerSubscriptionPlan,
  RegisterVehicleOption,
  SubscriptionPaymentInit,
  UnlimitedSubscription,
} from "../types/subscription";
import { SUBSCRIPTION_ERROR_CODES } from "../types/subscription";

// getPlans/getPlanById/register/renew/getInvoiceStatus/getMySubscriptions/cancel dưới đây
// đều gọi API thật (FE-US-56-04 đã thay hẳn 3 hàm register/renew/poll invoice sang
// SubscriptionPurchaseController + SubscriptionController.getInvoiceStatus của BE).

// Fallback vehicle list khi getCustomerProfile() (API thật) lỗi/chưa có BE chạy -
// để vẫn demo được luồng đăng ký mà không cần BE.
const FALLBACK_VEHICLES: RegisterVehicleOption[] = [
  { id: 1, licensePlate: "65A-12345", vehicleName: "Toyota Vios", hasActiveSubscription: false },
  { id: 2, licensePlate: "65B-67890", vehicleName: "Honda City", hasActiveSubscription: false },
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

// FE-US-56-04: POST /api/customer/subscriptions/unlimited - đăng ký gói mới, trả về QR thanh toán.
export const register = async (
  subscriptionPlanId: number,
  vehicleId: number,
  vehicleAlreadySubscribed: boolean,
): Promise<SubscriptionPaymentInit> => {
  if (!vehicleId) {
    return rejectWith("Vehicle is required.", SUBSCRIPTION_ERROR_CODES.VEHICLE_REQUIRED);
  }
  if (vehicleAlreadySubscribed) {
    return rejectWith(
      "The vehicle is already registered with another subscription plan.",
      SUBSCRIPTION_ERROR_CODES.VEHICLE_ALREADY_SUBSCRIBED,
    );
  }

  const res = await axiosClient.post<ApiSuccessResponse<SubscriptionPaymentInit>>(
    API.CUSTOMER.SUBSCRIPTION_PURCHASE.REGISTER,
    { subscriptionPlanId, vehicleId },
  );
  return res.data.data;
};

// FE-US-56-04: POST /api/customer/subscriptions/unlimited/{id}/renew - gia hạn gói đang có, trả về QR thanh toán.
export const renew = async (subscriptionId: number): Promise<SubscriptionPaymentInit> => {
  const res = await axiosClient.post<ApiSuccessResponse<SubscriptionPaymentInit>>(
    API.CUSTOMER.SUBSCRIPTION_PURCHASE.RENEW(subscriptionId),
  );
  return res.data.data;
};

// FE-US-56-04: GET /api/subscriptions/invoices/{invoiceId} - poll trạng thái hóa đơn QR
// (PENDING/PAID/FAILED), dùng chung cho cả đăng ký mới lẫn gia hạn.
export const getInvoiceStatus = async (invoiceId: number): Promise<SubscriptionPaymentInit> => {
  const res = await axiosClient.get<ApiSuccessResponse<SubscriptionPaymentInit>>(
    API.CUSTOMER.SUBSCRIPTION_PURCHASE.INVOICE_STATUS(invoiceId),
  );
  return res.data.data;
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

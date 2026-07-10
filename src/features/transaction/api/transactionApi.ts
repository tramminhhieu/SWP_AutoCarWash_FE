// API cho Transaction feature: payment history + active subscription
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  PaymentHistoryEntry,
  PaymentType,
  ActiveSubscriptionInfo,
} from "../types/transaction";

// GET /api/payments/history?type=&year=&month= — year (nếu có) override fromDate/toDate
// bên BE, month chỉ có tác dụng khi kèm year (theo đúng convention của endpoint này)
export async function getPaymentHistory(
  type?: PaymentType,
  year?: number,
  month?: number,
): Promise<PaymentHistoryEntry[]> {
  const res = await axiosClient.get<ApiSuccessResponse<PaymentHistoryEntry[]>>(
    API.PAYMENTS.HISTORY,
    { params: { type, year, month } },
  );
  return res.data.data;
}

// GET /api/subscriptions/active — 204 No Content nếu customer chưa có gói active
export async function getActiveSubscription(): Promise<ActiveSubscriptionInfo | null> {
  const res = await axiosClient.get<
    ApiSuccessResponse<ActiveSubscriptionInfo> | ""
  >(API.SUBSCRIPTIONS.ACTIVE, {
    validateStatus: (status) => status === 200 || status === 204,
  });
  if (res.status === 204 || !res.data) return null;
  return (res.data as ApiSuccessResponse<ActiveSubscriptionInfo>).data;
}

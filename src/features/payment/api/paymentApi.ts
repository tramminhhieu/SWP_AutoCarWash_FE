/* @author: BaoNgoc */
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  PaymentCheckoutResponse,
  CashPaymentRequest,
  CashPaymentResponse,
} from "../types/payment";

// Lấy dữ liệu hóa đơn để thanh toán (thông tin xe, khách, dịch vụ, điểm, voucher)
export const getPaymentCheckout = async (
  bookingId: number,
): Promise<PaymentCheckoutResponse> => {
  const res = await axiosClient.get<
    ApiSuccessResponse<PaymentCheckoutResponse>
  >(`/api/payment/checkout/${bookingId}`);
  return res.data.data;
};

// Thanh toán tiền mặt: gửi kèm số điểm đã đổi (usedLoyaltyPoints)
export const processCashPayment = async (
  data: CashPaymentRequest,
): Promise<CashPaymentResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CashPaymentResponse>>(
    "/api/payments/cash",
    data,
  );
  return res.data.data;
};

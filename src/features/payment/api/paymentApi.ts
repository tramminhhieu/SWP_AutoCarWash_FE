/* @author: BaoNgoc */
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  PaymentBookingDetail,
  CashPaymentRequest,
  CashPaymentResponse,
} from "../types/payment";

// ── API calls ──────────────────────────────────────────────────────────────

/** Lấy chi tiết booking phục vụ màn thanh toán (kèm điểm, hạng khách). */
export const getPaymentBookingDetail = async (
  bookingId: number,
): Promise<PaymentBookingDetail> => {
  const res = await axiosClient.get<ApiSuccessResponse<PaymentBookingDetail>>(
    API.BOOKINGS.DETAIL(bookingId),
  );
  return res.data.data;
};

/** Thanh toán tiền mặt (kèm đổi điểm nếu có). */
export const processCashPayment = async (
  data: CashPaymentRequest,
): Promise<CashPaymentResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CashPaymentResponse>>(
    API.PAYMENTS.CASH,
    data,
  );
  return res.data.data;
};

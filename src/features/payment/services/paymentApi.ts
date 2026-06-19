/@author: BaoNgoc/
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CashPaymentRequest {
  bookingId: number;
  receivedAmount: number;
}

export interface CashPaymentResponse {
  invoiceId: number;
  totalAmount: number;
  receivedAmount: number;
  changeAmount: number;
  bookingStatus: string;
  paymentStatus: string;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const processCashPayment = async (
  data: CashPaymentRequest
): Promise<CashPaymentResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CashPaymentResponse>>(
    "/api/payments/cash",
    data
  );
  return res.data.data;
};
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

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

export const processCashPayment = async (
  data: CashPaymentRequest
): Promise<CashPaymentResponse> => {
  const response = await axios.post(`${API_BASE_URL}/payments/cash`, data);
  return response.data;
};
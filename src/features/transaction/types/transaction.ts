// Mirrors backend `payment/dto/response/PaymentHistoryResponse.java`,
// returned by GET /api/payments/history
export type PaymentType = "DEPOSIT" | "FULL_PAYMENT" | "SUBSCRIPTION";

export interface PaymentHistoryEntry {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentType: PaymentType;
  transactionCode: string;
  paidAt: string; // "yyyy-MM-dd'T'HH:mm:ss"
  bookingId: number | null;
  subscriptionInvoiceId: number | null;
}

// Mirrors backend `subscription/dto/response/ActiveSubscriptionResponse.java`,
// returned by GET /api/subscriptions/active (204 No Content nếu chưa có gói active)
export interface ActiveSubscriptionInfo {
  planName: string;
  planType: string;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
}

// Mirrors backend `payment/dto/response/PaymentTransactionResponse.java` +
// `PaymentTransactionHistoryResponse.java`, returned by
// GET /api/payments/transactions (admin/staff only, not scoped to a customer).
export type AdminPaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "MANUAL"
  | "MOMO"
  | "VNPAY";

export type AdminPaymentStatus = "SUCCESS" | "FAILED";

// Request-only filter (BE's `type` query param) - KHÔNG có trong response row,
// chỉ dùng để lọc phía server. SUBSCRIPTION và DEPOSIT/FULL_PAYMENT tách biệt
// hoàn toàn theo yêu cầu "không để chung 2 loại này".
export type AdminTransactionTypeFilter =
  | "SUBSCRIPTION"
  | "DEPOSIT"
  | "FULL_PAYMENT";

export interface AdminPaymentRow {
  id: number; // transaction ID
  bookingId: number | null; // null cho subscription payment
  customerPhone: string | null;
  paymentMethod: AdminPaymentMethod;
  amount: number;
  paymentStatus: AdminPaymentStatus;
  paidAt: string; // "yyyy-MM-dd'T'HH:mm:ss"
}

export interface TransactionKpiSummary {
  totalRevenue: number; // từ BE summary.totalRevenue
  totalCount: number; // từ BE summary.totalCount
  successCount: number; // suy ra client-side từ danh sách transactions đã fetch
  failedCount: number;
}

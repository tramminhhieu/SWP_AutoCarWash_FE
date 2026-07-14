// Mirrors backend `refund/dto/response/*.java`, returned by the admin-only
// GET /api/refunds, GET /api/refunds/{id}, POST /api/refunds/{id}/confirm (US-05).

export type RefundStatus = "PENDING" | "REFUNDED";

// Mirrors RefundListItemResponse.java
export interface RefundListItem {
  id: number;
  bookingId: number;
  customerName: string;
  customerPhone: string;
  stationName: string;
  refundAmount: number;
  status: RefundStatus;
  createdAt: string;
  refundedAt: string | null;
}

// Mirrors RefundSummaryResponse.java
export interface RefundSummary {
  totalCount: number;
  totalRefundedAmount: number;
}

// Mirrors RefundListPageResponse.java
export interface RefundListPage {
  summary: RefundSummary;
  content: RefundListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Mirrors RefundDetailResponse.java
export interface RefundDetail {
  id: number;
  bookingId: number;
  customerName: string;
  customerPhone: string;
  serviceCategoryName: string;
  appointmentDate: string;
  refundAmount: number;
  refundBankName: string;
  refundAccountNumber: string;
  refundAccountHolder: string;
  stationName: string;
  status: RefundStatus;
  // Ảnh QR VietQR - null nếu đã hoàn tiền hoặc bank không map được BIN (AC2c).
  qrImageUrl: string | null;
  refundNote: string | null;
  refundedAt: string | null;
  refundedBy: number | null;
  createdAt: string;
}

export interface RefundListFilters {
  page?: number;
  size?: number;
  status?: RefundStatus;
  year?: number;
  month?: number;
  stationId?: number;
  keyword?: string;
}

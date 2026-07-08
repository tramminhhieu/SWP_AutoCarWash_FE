// API cho Admin Transaction History: GET /api/payments/transactions
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AdminPaymentRow,
  AdminPaymentMethod,
  AdminPaymentStatus,
  AdminTransactionTypeFilter,
} from "../types/adminTransaction";

interface RawTransactionSummary {
  totalRevenue: number;
  totalCount: number;
}

interface RawTransactionHistoryResponse {
  summary: RawTransactionSummary;
  transactions: AdminPaymentRow[];
}

export interface AdminTransactionFilters {
  method?: AdminPaymentMethod;
  status?: AdminPaymentStatus;
  type?: AdminTransactionTypeFilter;
  fromDate?: string; // "yyyy-MM-ddTHH:mm:ss"
  toDate?: string;
  // stationId chỉ áp dụng cho single-wash (subscription không gắn station).
  stationId?: number;
  // Tìm theo SĐT khách hàng (partial match, áp dụng cả 2 loại giao dịch) hoặc
  // theo booking ID (exact match, chỉ áp dụng single-wash) - search bar chỉ
  // gửi 1 trong 2, không gửi đồng thời.
  phone?: string;
  bookingId?: number;
}

export interface AdminTransactionResult {
  summary: RawTransactionSummary;
  transactions: AdminPaymentRow[];
}

export async function getAdminTransactions(
  filters: AdminTransactionFilters,
): Promise<AdminTransactionResult> {
  const res = await axiosClient.get<
    ApiSuccessResponse<RawTransactionHistoryResponse>
  >(API.PAYMENTS.TRANSACTIONS, { params: filters });
  return res.data.data;
}

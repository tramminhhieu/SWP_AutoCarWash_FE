// API cho Admin Refund Management: GET/POST /api/refunds (US-05)
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  RefundDetail,
  RefundListFilters,
  RefundListPage,
} from "../types/refund";

export async function getAdminRefunds(
  filters: RefundListFilters,
): Promise<RefundListPage> {
  const res = await axiosClient.get<ApiSuccessResponse<RefundListPage>>(
    API.REFUNDS.LIST,
    { params: filters },
  );
  return res.data.data;
}

export async function getRefundDetail(id: number): Promise<RefundDetail> {
  const res = await axiosClient.get<ApiSuccessResponse<RefundDetail>>(
    API.REFUNDS.DETAIL(id),
  );
  return res.data.data;
}

export async function confirmRefund(
  id: number,
  transactionCode: string,
): Promise<RefundDetail> {
  const res = await axiosClient.post<ApiSuccessResponse<RefundDetail>>(
    API.REFUNDS.CONFIRM(id),
    { transactionCode },
  );
  return res.data.data;
}

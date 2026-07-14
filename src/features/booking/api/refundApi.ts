import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AccountLookupResponse,
  BankOption,
  CreateRefundRequest,
  DepositAmountResponse,
  RefundResponse,
} from "../types/refund";

/** Lấy danh sách ngân hàng (BankEnum) từ backend cho dropdown chọn ngân hàng. */
export async function fetchBanks(): Promise<BankOption[]> {
  const res = await axiosClient.get<ApiSuccessResponse<BankOption[]> | BankOption[]>(
    API.REFUNDS.BANKS,
  );
  // Chấp nhận cả response bọc envelope {data} lẫn trả mảng trực tiếp → luôn trả về mảng
  const body = res.data as ApiSuccessResponse<BankOption[]> | BankOption[];
  const list = Array.isArray(body) ? body : body?.data;
  return Array.isArray(list) ? list : [];
}

/** Tra cứu tên chủ tài khoản qua proxy BE (VietQR Lookup) — AC2.1. */
export async function lookupAccount(
  bin: string,
  accountNumber: string,
): Promise<AccountLookupResponse> {
  const res = await axiosClient.get<ApiSuccessResponse<AccountLookupResponse>>(
    API.REFUNDS.ACCOUNT_LOOKUP,
    { params: { bin, accountNumber } },
  );
  return res.data.data;
}

/** Lấy số tiền cọc cố định để hiển thị read-only trên form. */
export async function getDepositAmount(): Promise<DepositAmountResponse> {
  const res = await axiosClient.get<ApiSuccessResponse<DepositAmountResponse>>(
    API.REFUNDS.DEPOSIT_AMOUNT,
  );
  return res.data.data;
}

/** Tạo yêu cầu hoàn tiền khi customer xác nhận hủy (AC3). */
export async function createRefund(
  data: CreateRefundRequest,
): Promise<RefundResponse> {
  const res = await axiosClient.post<ApiSuccessResponse<RefundResponse>>(
    API.REFUNDS.CREATE,
    data,
  );
  return res.data.data;
}

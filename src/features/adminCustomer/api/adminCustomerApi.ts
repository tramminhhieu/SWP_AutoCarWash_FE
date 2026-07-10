// API cho Admin Customer Management: GET /api/customers
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AdminCustomerRow,
  AdminCustomerDetail,
  CustomerKpiSummary,
} from "../types/adminCustomer";

interface RawCustomerListPageResponse {
  summary: CustomerKpiSummary;
  content: AdminCustomerRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminCustomerFilters {
  page?: number;
  size?: number;
  keyword?: string;
  year?: number;
  month?: number;
  tier?: string;
  active?: boolean;
}

export async function getAdminCustomers(
  filters: AdminCustomerFilters,
): Promise<RawCustomerListPageResponse> {
  const res = await axiosClient.get<
    ApiSuccessResponse<RawCustomerListPageResponse>
  >(API.CUSTOMERS.LIST, { params: filters });
  return res.data.data;
}

export async function getAdminCustomerDetail(
  customerId: number,
): Promise<AdminCustomerDetail> {
  const res = await axiosClient.get<ApiSuccessResponse<AdminCustomerDetail>>(
    API.CUSTOMERS.DETAIL(customerId),
  );
  return res.data.data;
}

export async function deleteAdminCustomer(customerId: number): Promise<void> {
  await axiosClient.delete(API.CUSTOMERS.DETAIL(customerId));
}

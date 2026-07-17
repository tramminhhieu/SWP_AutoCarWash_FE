// API cho Admin Employee Management: GET /api/employees
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AdminEmployeeRow,
  AdminEmployeeDetail,
  CreateEmployeePayload,
  EmployeeKpiSummary,
  UpdateEmployeePayload,
} from "../types/adminEmployee";

interface RawEmployeeListPageResponse {
  summary: EmployeeKpiSummary;
  content: AdminEmployeeRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminEmployeeFilters {
  page?: number;
  size?: number;
  keyword?: string;
  active?: boolean;
  stationId?: number;
  communeId?: number;
  provinceId?: number;
}

export async function getAdminEmployees(
  filters: AdminEmployeeFilters,
): Promise<RawEmployeeListPageResponse> {
  const res = await axiosClient.get<
    ApiSuccessResponse<RawEmployeeListPageResponse>
  >(API.EMPLOYEES.LIST, { params: filters });
  return res.data.data;
}

export async function getAdminEmployeeDetail(
  employeeId: number,
): Promise<AdminEmployeeDetail> {
  const res = await axiosClient.get<ApiSuccessResponse<AdminEmployeeDetail>>(
    API.EMPLOYEES.DETAIL(employeeId),
  );
  return res.data.data;
}

export async function createAdminEmployee(
  payload: CreateEmployeePayload,
): Promise<AdminEmployeeDetail> {
  const res = await axiosClient.post<ApiSuccessResponse<AdminEmployeeDetail>>(
    API.EMPLOYEES.CREATE,
    payload,
  );
  return res.data.data;
}

export async function updateAdminEmployee(
  employeeId: number,
  payload: UpdateEmployeePayload,
): Promise<AdminEmployeeDetail> {
  const res = await axiosClient.put<ApiSuccessResponse<AdminEmployeeDetail>>(
    API.EMPLOYEES.DETAIL(employeeId),
    payload,
  );
  return res.data.data;
}

export async function deleteAdminEmployee(employeeId: number): Promise<void> {
  await axiosClient.delete(API.EMPLOYEES.DETAIL(employeeId));
}

import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type { ServicePackage } from "../types/servicePackage";

/** Lấy toàn bộ gói dịch vụ - dùng cho ServicePackageList (customer) và dropdown
 * Service Package trong form Subscription Plan (admin, chỉ lấy status = ACTIVE). */
export async function getAll(): Promise<ServicePackage[]> {
  const res = await axiosClient.get<ApiSuccessResponse<ServicePackage[]>>(
    API.SERVICE_PACKAGE.LIST,
  );
  return res.data.data;
}

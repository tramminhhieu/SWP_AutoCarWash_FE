import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type { CreateAddonServiceRequest, ServiceCategoryOption } from "../types/addonService";

// GET /api/admin/service-categories
export const getServiceCategoryOptions = async (): Promise<ServiceCategoryOption[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<ServiceCategoryOption[]>>(
    API.ADMIN.SERVICE_CATEGORY.LIST,
  );
  return res.data.data;
};

// POST /api/admin/addon-services - tạo add-on mới, dùng chung được ngay cho mọi gói khác
// (không riêng cho gói nào cả - đây là 1 dòng addon_service thật trong DB).
export const create = async (
  data: CreateAddonServiceRequest,
): Promise<ApiSuccessResponse<unknown>> => {
  const res = await axiosClient.post<ApiSuccessResponse<unknown>>(
    API.ADMIN.ADDON_SERVICE.CREATE,
    data,
  );
  return res.data;
};

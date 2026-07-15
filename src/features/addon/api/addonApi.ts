import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AddonService,
  CreateAddonRequest,
  UpdateAddonRequest,
} from "../types/addon";

/** GET /api/addon-services — lấy toàn bộ addon đang hoạt động (API-15-04). */
export async function getAllAddonServices(): Promise<AddonService[]> {
  const res = await axiosClient.get<ApiSuccessResponse<AddonService[]>>(
    API.ADDON.LIST,
  );
  return res.data.data;
}

/** POST /api/addon-services — tạo add-on mới (API-15-01, chỉ ADMIN). */
export async function createAddonService(
  body: CreateAddonRequest,
): Promise<AddonService> {
  const res = await axiosClient.post<ApiSuccessResponse<AddonService>>(
    API.ADDON.LIST, // cùng endpoint, khác method (POST)
    body,
  );
  return res.data.data;
}

/** PUT /api/addon-services/{id} — cập nhật add-on (API-15-02, chỉ ADMIN). */
export async function updateAddonService(
  addonServiceId: number,
  body: UpdateAddonRequest,
): Promise<AddonService> {
  const res = await axiosClient.put<ApiSuccessResponse<AddonService>>(
    `${API.ADDON.LIST}/${addonServiceId}`,
    body,
  );
  return res.data.data;
}

/** DELETE /api/addon-services/{id} — xoá mềm add-on (API-15-03, chỉ ADMIN). */
export async function deleteAddonService(
  addonServiceId: number,
): Promise<void> {
  await axiosClient.delete(`${API.ADDON.LIST}/${addonServiceId}`);
}

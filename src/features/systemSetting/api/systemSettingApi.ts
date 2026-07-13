import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  CreateSystemSettingRequest,
  SystemSettingsByCategory,
  SystemSettingWithCategoryDto,
  UpdateSystemSettingRequest,
} from "../types/systemSetting";

// API-35-01: GET /api/admin/system-settings - trả về đã gom theo category.
export async function getAllSystemSettings(): Promise<SystemSettingsByCategory> {
  const res = await axiosClient.get<ApiSuccessResponse<SystemSettingsByCategory>>(
    API.SYSTEM_SETTING.LIST,
  );
  return res.data.data;
}

// API-35-02: POST /api/admin/system-settings - tạo setting mới (chỉ ADMIN).
export async function createSystemSetting(
  body: CreateSystemSettingRequest,
): Promise<SystemSettingWithCategoryDto> {
  const res = await axiosClient.post<
    ApiSuccessResponse<SystemSettingWithCategoryDto>
  >(API.SYSTEM_SETTING.LIST, body);
  return res.data.data;
}

// API-35-03: PUT /api/admin/system-settings/{id} - chỉ sửa setting_value (chỉ ADMIN).
export async function updateSystemSetting(
  id: number,
  body: UpdateSystemSettingRequest,
): Promise<SystemSettingWithCategoryDto> {
  const res = await axiosClient.put<
    ApiSuccessResponse<SystemSettingWithCategoryDto>
  >(API.SYSTEM_SETTING.UPDATE(id), body);
  return res.data.data;
}

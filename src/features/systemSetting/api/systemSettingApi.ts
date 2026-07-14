import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type {
  SystemSetting,
  SystemSettingsGrouped,
  CreateSettingRequest,
  UpdateSettingRequest,
} from "../types/systemSetting";

// API-35-01: Lấy toàn bộ settings đã group sẵn theo category
export async function getAllSettings(): Promise<SystemSettingsGrouped> {
  const res = await axiosClient.get(API.SYSTEM_SETTINGS.LIST);
  return res.data.data;
}

// API-35-02: Tạo mới một setting
export async function createSetting(
  data: CreateSettingRequest,
): Promise<{ setting: SystemSetting; message: string }> {
  const res = await axiosClient.post(API.SYSTEM_SETTINGS.CREATE, data);
  return { setting: res.data.data, message: res.data.message };
}

// API-35-03: Cập nhật setting_value của một setting theo id
export async function updateSetting(
  id: number,
  data: UpdateSettingRequest,
): Promise<{ setting: SystemSetting; message: string }> {
  const res = await axiosClient.put(API.SYSTEM_SETTINGS.UPDATE(id), data);
  return { setting: res.data.data, message: res.data.message };
}

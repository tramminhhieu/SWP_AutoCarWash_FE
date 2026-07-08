import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  ServicePackage,
  CreateServicePackageRequest,
  UpdateServicePackageRequest,
  AddonService,
} from "../types/servicePackage";

/**
 * GET /api/service-packages — lấy toàn bộ gói dịch vụ active.
 */
export async function getAll(): Promise<ServicePackage[]> {
  const res = await axiosClient.get<ApiSuccessResponse<ServicePackage[]>>(
    API.SERVICE_PACKAGE.LIST,
  );
  return res.data.data;
}

/** POST /api/service-packages — tạo gói dịch vụ mới (API-14-01, chỉ ADMIN). */
export async function createServicePackage(
  body: CreateServicePackageRequest,
): Promise<ServicePackage> {
  const res = await axiosClient.post<ApiSuccessResponse<ServicePackage>>(
    API.SERVICE_PACKAGE.LIST,
    body,
  );
  return res.data.data;
}

/** PUT /api/service-packages/{id} — cập nhật gói dịch vụ (API-14-02, chỉ ADMIN). */
export async function updateServicePackage(
  servicePackageId: number,
  body: UpdateServicePackageRequest,
): Promise<ServicePackage> {
  const res = await axiosClient.put<ApiSuccessResponse<ServicePackage>>(
    `${API.SERVICE_PACKAGE.LIST}/${servicePackageId}`,
    body,
  );
  return res.data.data;
}

/**
 * GET /api/addon-services — lấy toàn bộ add-on active.
 * Gọi 1 lần khi vào trang Service Management, lưu lại để:
 * hiển thị ✓/✗ addon trong PackageCard + làm picker khi tạo/sửa package.
 */
export async function getAllAddonServices(): Promise<AddonService[]> {
  const res = await axiosClient.get<ApiSuccessResponse<AddonService[]>>(
    API.ADDON.LIST,
  );
  return res.data.data;
}

/** DELETE /api/service-packages/{id} — xoá mềm add-on (API-15-03, chỉ ADMIN). */
export async function deleteServicePackage(
  servicePackageId: number,
): Promise<void> {
  await axiosClient.delete(`${API.SERVICE_PACKAGE.LIST}/${servicePackageId}`);
}

import type { AddonService } from "../../addon/types/addon";
/**
 * Service Package — dùng chung cho Customer và Admin.
 * Cả 2 role đều trả addonIds (number[]), FE mapping qua danh sách addon
 * từ GET /api/addon-services để lấy tên hiển thị.
 */
export interface ServicePackage {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  durationMinutes: number;
  /** Danh sách id addon thuộc gói — dùng chung cả Customer và Admin. */
  addonIds: number[];
}

export interface CreateServicePackageRequest {
  name: string;
  basePrice: number;
  durationMinutes: number;
  description?: string | null;
  addonIds: number[];
}

/**
 * Request body cho PUT /api/service-packages/{id} (API-14-02).
 * Body giống hệt Create (cùng field), chỉ khác method + có id trên URL.
 */
export type UpdateServicePackageRequest = CreateServicePackageRequest;

/**
 * Add-on Service — response từ GET /api/addon-services.
 * Dùng để mapping addonIds → tên hiển thị, và làm picker khi tạo/sửa package.
 */
export type { AddonService };

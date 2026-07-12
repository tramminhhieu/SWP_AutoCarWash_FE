import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type { ServicePackage } from "../types/servicePackage";

// Response thật của GET /api/service-packages - trả addonIds (id thô), không phải tên
interface ServicePackageRaw {
  id: number;
  name: string;
  basePrice: number;
  description: string;
  durationMinutes: number;
  addonIds: number[];
}

interface AddonServiceOption {
  id: number;
  name: string;
}

/** Lấy toàn bộ gói dịch vụ - dùng cho ServicePackageList (customer) và dropdown
 * Service Package trong form Subscription Plan (admin, chỉ lấy status = ACTIVE).
 * BE chỉ trả addonIds nên phải gọi thêm /api/addon-services để resolve ra tên add-on
 * hiển thị (ServicePackage.addons: string[]). */
export async function getAll(): Promise<ServicePackage[]> {
  const [packagesRes, addonsRes] = await Promise.all([
    axiosClient.get<ApiSuccessResponse<ServicePackageRaw[]>>(API.SERVICE_PACKAGE.LIST),
    axiosClient.get<ApiSuccessResponse<AddonServiceOption[]>>(API.ADDON_SERVICE.LIST),
  ]);
  const addonNameById = new Map(addonsRes.data.data.map((a) => [a.id, a.name]));
  return packagesRes.data.data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    basePrice: p.basePrice,
    durationMinutes: p.durationMinutes,
    // BE trả addonIds bị lặp (bug join phía BE) - khử trùng lặp trước khi hiển thị
    addons: Array.from(new Set(p.addonIds))
      .map((id) => addonNameById.get(id))
      .filter((n): n is string => !!n),
  }));
}

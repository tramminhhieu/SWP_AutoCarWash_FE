// import axiosClient from "../../../lib/axiosClient";
// import { API } from "../../../constants/apiEndpoints";
// import type { ApiSuccessResponse } from "../../../types/apiResponse";
// import type {
//   AddonService,
//   CreateAddonRequest,
//   UpdateAddonRequest,
// } from "../types/addon";

// /** GET /api/addon-services — lấy toàn bộ addon đang hoạt động (API-15-04). */
// export async function getAllAddonServices(): Promise<AddonService[]> {
//   const res = await axiosClient.get<ApiSuccessResponse<AddonService[]>>(
//     API.ADDON.LIST,
//   );
//   return res.data.data;
// }

// /** POST /api/addon-services — tạo add-on mới (API-15-01, chỉ ADMIN). */
// export async function createAddonService(
//   body: CreateAddonRequest,
// ): Promise<AddonService> {
//   const res = await axiosClient.post<ApiSuccessResponse<AddonService>>(
//     API.ADDON.LIST, // cùng endpoint, khác method (POST)
//     body,
//   );
//   return res.data.data;
// }

// /** PUT /api/addon-services/{id} — cập nhật add-on (API-15-02, chỉ ADMIN). */
// export async function updateAddonService(
//   addonServiceId: number,
//   body: UpdateAddonRequest,
// ): Promise<AddonService> {
//   const res = await axiosClient.put<ApiSuccessResponse<AddonService>>(
//     `${API.ADDON.LIST}/${addonServiceId}`,
//     body,
//   );
//   return res.data.data;
// }

// /** DELETE /api/addon-services/{id} — xoá mềm add-on (API-15-03, chỉ ADMIN). */
// export async function deleteAddonService(
//   addonServiceId: number,
// ): Promise<void> {
//   await axiosClient.delete(`${API.ADDON.LIST}/${addonServiceId}`);
// }
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AddonService,
  CreateAddonRequest,
  UpdateAddonRequest,
} from "../types/addon";

/* ================================================================
   Bật USE_MOCK = true khi chưa có BE, tắt lại khi BE sẵn sàng.
   ================================================================ */
const USE_MOCK = true;

const MOCK_ADDON_SERVICES: AddonService[] = [
  {
    id: 1,
    name: "Wax Coating",
    price: 20000,
    durationMinutes: 15,
    description: "Phủ sáp bảo vệ lớp sơn ngoài",
  },
  {
    id: 2,
    name: "Interior Deep Clean",
    price: 50000,
    durationMinutes: 30,
    description: null,
  },
  {
    id: 3,
    name: "Tire Shine",
    price: 15000,
    durationMinutes: 10,
    description: "Đánh bóng lốp xe",
  },
  {
    id: 4,
    name: "Engine Bay Wash",
    price: 80000,
    durationMinutes: 45,
    description: "Rửa khoang động cơ",
  },
  {
    id: 5,
    name: "Ceramic Coating",
    price: 150000,
    durationMinutes: 60,
    description: "Phủ ceramic nano bảo vệ sơn xe",
  },
  {
    id: 6,
    name: "Odor Removal",
    price: 35000,
    durationMinutes: 20,
    description: "Khử mùi nội thất bằng máy ozone",
  },
];

/** GET /api/addon-services — lấy toàn bộ addon đang hoạt động (API-15-04). */
export async function getAllAddonServices(): Promise<AddonService[]> {
  if (USE_MOCK) {
    return new Promise((r) => setTimeout(() => r(MOCK_ADDON_SERVICES), 300));
  }
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

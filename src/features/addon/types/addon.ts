/**
 * Dịch vụ add-on — khớp response GET /api/addon-services (API-15-04).
 * BE đã loại is_deleted và service_category_id, FE chỉ nhận đúng 5 field này.
 */
export interface AddonService {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  description: string | null;
}

/**
 * Request body tạo add-on mới — POST /api/addon-services (API-15-01).
 * KHÔNG gửi id / isDeleted / serviceCategoryId (BE tự xử lý).
 */
export interface CreateAddonRequest {
  name: string;
  price: number;
  durationMinutes: number;
  description?: string | null;
}

/**
 * Request body cập nhật add-on — PUT /api/addon-services/{id} (API-15-02).
 * Body giống hệt Create (cùng field), chỉ khác method + có id trên URL.
 */
export type UpdateAddonRequest = CreateAddonRequest;

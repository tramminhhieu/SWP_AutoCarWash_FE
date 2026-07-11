// Khớp bảng addon_service + service_category thật trong data.sql.
// ⚠️ Chưa có AC/API nào cho Add-on trong Note.md - trang Create dựng theo đúng field DB
// thật (name, price, duration_minutes, service_category_id, is_deleted) + layout tham khảo
// từ prototype "Add New Add-on", KHÔNG có validation rule chính thức từ BE nên tạm áp dụng
// rule tương tự Subscription Plan (required + > 0). Xác nhận lại với Nora khi có AC thật.
export type AddonServiceStatus = "ACTIVE" | "INACTIVE";

// service_category thật chỉ có đúng 3 dòng trong data.sql
export interface ServiceCategoryOption {
  id: number;
  name: string;
}

export interface AddonService {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  serviceCategoryId: number;
  serviceCategoryName: string;
  status: AddonServiceStatus; // suy ra từ is_deleted (false -> ACTIVE)
}

export interface CreateAddonServiceRequest {
  name: string;
  price: number;
  durationMinutes: number;
  serviceCategoryId: number;
}

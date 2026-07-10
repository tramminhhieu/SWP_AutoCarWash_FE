// Khớp bảng addon_service + service_category thật trong data.sql.
export interface ServiceCategoryOption {
  id: number;
  name: string;
}

export interface CreateAddonServiceRequest {
  name: string;
  price: number;
  durationMinutes: number;
  serviceCategoryId: number;
}

// Các kiểu dữ liệu BE hỗ trợ cho setting_value
export type DataType = "NUMBER" | "STRING" | "BOOLEAN";

// Một setting đơn lẻ — khớp với response từ API-35-01 và API-35-03
export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  data_type: DataType;
  category?: string; // có trong response CREATE (API-35-02), không có trong GET ALL
}

// Response data từ GET ALL: BE đã group sẵn theo category
export type SystemSettingsGrouped = Record<string, SystemSetting[]>;

// Request body cho CREATE (API-35-02)
export interface CreateSettingRequest {
  setting_key: string;
  setting_value: string;
  category: string;
  data_type: DataType;
  description: string;
}

// Request body cho UPDATE — chỉ nhận setting_value (API-35-03)
export interface UpdateSettingRequest {
  setting_value: string;
}

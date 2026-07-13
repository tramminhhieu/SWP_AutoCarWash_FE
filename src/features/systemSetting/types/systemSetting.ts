// API-35: /api/admin/system-settings - Controller/DTOs CHƯA tồn tại bên BE tại thời điểm viết
// (chỉ có Entity + Repository + vài getter đọc-only nội bộ), nên field name dưới đây đi thẳng
// theo tài liệu API-35 (snake_case), KHÔNG verify được qua response thật. Khi BE dựng xong
// Controller/DTOs thật, phải đối chiếu lại field casing (rất có thể BE sẽ trả camelCase theo
// quy ước Jackson mặc định như mọi feature khác trong repo, không phải snake_case).

export type SettingDataType = "NUMBER" | "BOOLEAN" | "STRING";

export interface SystemSettingDto {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
  data_type: SettingDataType;
}

// API-35-01: GET /api/admin/system-settings - data đã được BE group by category, key = tên
// category (vd "Payment & Deposit"), value = mảng setting thuộc category đó.
export type SystemSettingsByCategory = Record<string, SystemSettingDto[]>;

// API-35-02/03: response của POST và PUT (khác GET) - theo đúng ví dụ trong tài liệu, cả 2 đều
// trả kèm "category" ngay trên object (vì lúc đó dữ liệu chưa được gom nhóm), khác các item nằm
// trong SystemSettingsByCategory (không có category vì đã ngụ ý qua key của map).
export interface SystemSettingWithCategoryDto extends SystemSettingDto {
  category: string;
}

// API-35-02: POST /api/admin/system-settings
export interface CreateSystemSettingRequest {
  setting_key: string;
  setting_value: string;
  category: string;
  data_type: SettingDataType;
  description: string;
}

// API-35-03: PUT /api/admin/system-settings/{id} - chỉ nhận duy nhất giá trị mới, không cho
// sửa key/category/data_type qua API này.
export interface UpdateSystemSettingRequest {
  setting_value: string;
}

// Tài liệu API-35 chỉ nêu rõ 1 errorCode (INVALID_SETTING_VALUE cho PUT). Case trùng
// setting_key ở POST (400) không có body mẫu -> không đoán errorCode, để trống, FE sẽ fallback
// dùng message thô từ BE qua getApiErrorInfo.
export const SYSTEM_SETTING_ERROR_CODES = {
  INVALID_SETTING_VALUE: "INVALID_SETTING_VALUE",
} as const;

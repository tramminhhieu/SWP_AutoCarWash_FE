// Khớp bảng subscription_plan (data.sql thật) + AC FE-53 (Note.md).
// plan_type thật là "UNLIMIT" - đã confirm trực tiếp với BE ngày 2026-07-08 (kết luận cũ ở
// đây nói "UNLIMITED" mới đúng theo data.sql seed là SAI, BE xác nhận lại giá trị thật là
// "UNLIMIT" khớp spec Sprint 3). UI vẫn hiển thị chữ "UNLIMITED" cho người dùng - xem
// getSubscriptionTypeLabel() trong src/constants/subscriptionStyles.ts.
export type PlanType = "FAMILY" | "UNLIMIT";
export type PlanStatus = "ACTIVE" | "INACTIVE";
export type PlanStatusFilter = "ALL" | PlanStatus;

// GET /api/admin/subscription-plans - 1 dòng trong danh sách (id không hiển thị trên UI
// nhưng BE cần trả về để FE điều hướng Edit/Delete - xem note "Contradiction #4" đã báo Nora)
export interface SubscriptionPlan {
  id: number;
  planName: string;
  price: number;
  durationDays: number;
  planType: PlanType;
  description: string;
  maxVehicleCount: number | null; // 1 khi planType = UNLIMITED (data.sql thật cũng luôn để 1, không null)
  servicePackageName: string;
  // Tên các add-on đi kèm gói (quyền lợi hiển thị) - riêng biệt với servicePackageName ở trên
  // (servicePackageName vẫn quyết định hạng dịch vụ rửa xe cho booking/walk-in).
  addonNames: string[];
  status: PlanStatus;
}

// GET /api/admin/subscription-plans/{id} - chi tiết để pre-fill form Edit
export interface SubscriptionPlanDetail {
  id: number;
  planName: string;
  price: number;
  durationDays: number;
  description: string;
  // BE tự tạo/gán Service Package riêng cho gói dựa trên add-on đã chọn - không còn cho admin
  // chọn/sửa trực tiếp nữa, chỉ giữ lại để tham khảo nếu cần.
  servicePackageId: number;
  planType: PlanType;
  maxVehicleCount: number | null;
  status: PlanStatus;
  addonServiceIds: number[];
}

// POST /api/admin/subscription-plans
export interface CreateSubscriptionPlanRequest {
  planName: string;
  price: number;
  durationDays: number;
  description: string;
  planType: PlanType;
  // UNLIMITED: FE tự gán 1 (ẩn field, không cho sửa) theo comment trong Note.md + data.sql thật
  // FAMILY: bắt buộc > 1, do người dùng nhập
  maxVehicleCount: number;
  // Add-on tạo nên nội dung gói (thay cho việc chọn 1 Service Package có sẵn) - BE sẽ tự tạo
  // 1 Service Package mới riêng cho gói này từ danh sách add-on được chọn. Bắt buộc chọn >= 1.
  addonServiceIds: number[];
}

// PUT /api/admin/subscription-plans/{id}
export interface UpdateSubscriptionPlanRequest extends CreateSubscriptionPlanRequest {
  status: PlanStatus;
}

// Add-on để chọn nhiều (checkbox) trong form Create/Update - GET /api/admin/addon-services/active
export interface AddonServiceOption {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
}

// errorCode nghiệp vụ BE trả về = ErrorCode enum's "code" field (vd "SUBSCRIPTION_004"), KHÔNG
// phải tên hằng số enum - xem GlobalExceptionHandler.handleBaseException/handleValidation
// (BE) để đối chiếu khi thêm/sửa mã lỗi mới.
export const SUBSCRIPTION_PLAN_ERROR_CODES = {
  PLAN_NAME_REQUIRED: "SUBSCRIPTION_004",
  ADDON_SERVICES_REQUIRED: "SUBSCRIPTION_032",
  INVALID_ADDON_SERVICE: "SUBSCRIPTION_031",
  INVALID_PRICE: "SUBSCRIPTION_006",
  INVALID_DURATION_DAYS: "SUBSCRIPTION_007",
  INVALID_MAX_VEHICLE_COUNT: "SUBSCRIPTION_008",
  INVALID_PLAN_TYPE: "SUBSCRIPTION_010",
  INVALID_STATUS: "SUBSCRIPTION_011",
  SUBSCRIPTION_PLAN_NOT_FOUND: "SUBSCRIPTION_002",
  SUBSCRIPTION_PLAN_ALREADY_INACTIVE: "SUBSCRIPTION_013",
} as const;

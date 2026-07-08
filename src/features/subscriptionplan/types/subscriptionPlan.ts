// Khớp bảng subscription_plan (data.sql thật) + AC FE-53 (Note.md).
// plan_type thật trong DB là "UNLIMITED" (Note.md ghi "UNLIMIT" ở vài chỗ là lỗi đánh máy -
// đã xác nhận lại bằng data.sql, seed data chỉ có 'UNLIMITED'/'FAMILY').
export type PlanType = "FAMILY" | "UNLIMITED";
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
  status: PlanStatus;
}

// GET /api/admin/subscription-plans/{id} - chi tiết để pre-fill form Edit
export interface SubscriptionPlanDetail {
  id: number;
  planName: string;
  price: number;
  durationDays: number;
  description: string;
  servicePackageId: number;
  planType: PlanType;
  maxVehicleCount: number | null;
  status: PlanStatus;
}

// POST /api/admin/subscription-plans
export interface CreateSubscriptionPlanRequest {
  planName: string;
  price: number;
  durationDays: number;
  description: string;
  servicePackageId: number;
  planType: PlanType;
  // UNLIMITED: FE tự gán 1 (ẩn field, không cho sửa) theo comment trong Note.md + data.sql thật
  // FAMILY: bắt buộc > 1, do người dùng nhập
  maxVehicleCount: number;
}

// PUT /api/admin/subscription-plans/{id}
export interface UpdateSubscriptionPlanRequest extends CreateSubscriptionPlanRequest {
  status: PlanStatus;
}

// Service package để chọn trong dropdown form Create/Update - chỉ lấy status = ACTIVE
export interface ServicePackageOption {
  id: number;
  name: string;
}

// Các errorCode nghiệp vụ BE trả về (theo Note.md) - dùng để map lỗi vào đúng field trên form
export const SUBSCRIPTION_PLAN_ERROR_CODES = {
  PLAN_NAME_REQUIRED: "PLAN_NAME_REQUIRED",
  SERVICE_PACKAGE_REQUIRED: "SERVICE_PACKAGE_REQUIRED",
  INVALID_PRICE: "INVALID_PRICE",
  INVALID_DURATION_DAYS: "INVALID_DURATION_DAYS",
  INVALID_MAX_VEHICLE_COUNT: "INVALID_MAX_VEHICLE_COUNT",
  INVALID_PLAN_TYPE: "INVALID_PLAN_TYPE",
  INVALID_STATUS: "INVALID_STATUS",
  INVALID_SERVICE_PACKAGE: "INVALID_SERVICE_PACKAGE",
  SUBSCRIPTION_PLAN_NOT_FOUND: "SUBSCRIPTION_PLAN_NOT_FOUND",
  SUBSCRIPTION_PLAN_ALREADY_INACTIVE: "SUBSCRIPTION_PLAN_ALREADY_INACTIVE",
} as const;

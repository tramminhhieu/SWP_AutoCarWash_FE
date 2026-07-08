export interface CustomerInfo {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string; // "YYYY-MM-DD"
  email: string;
  phone: string;
}

export interface CustomerTier {
  currentTierName: string;
  currentPoints: number;
  nextTierName: string | null;
  nextTierMinPoints: number | null;
  pointsToNextTier: number | null;
}

export interface VehicleActiveSubscription {
  type: string; // "UNLIMIT" | "FAMILY" (giá trị thật BE trả, confirm 2026-07-08 - UI hiển thị
  // "UNLIMITED" qua getSubscriptionTypeLabel(), xem src/constants/subscriptionStyles.ts)
  // Chỉ gửi khi xe đang trong lock period (last_vehicle_change_at chưa hết hạn)
  hasTransferred?: boolean;
  transferUnlockDate?: string; // "YYYY-MM-DD"
}

export interface CustomerVehicle {
  id: number;
  licensePlate: string;
  brandName: string;
  color: string | null;
  // Không có key này nếu xe không có gói đang active
  activeSubscription?: VehicleActiveSubscription;
}

export interface CustomerProfileData {
  customer: CustomerInfo;
  tier: CustomerTier | null; // null khi BE chưa code tier
  vehicles: CustomerVehicle[]; // [] khi chưa có xe, không bao giờ null
}

export interface CustomerProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfileData;
}

// Request cho PUT /api/customers/profile (API-05-01) — chỉ field có trong DB
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  birthday: string; // "YYYY-MM-DD"
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: CustomerInfo;
}

// Lỗi field-level trong mảng errors[] khi COMMON_003 (VALIDATION_FAILED)
export interface ProfileFieldError {
  field: string;
  errorCode: string;
  message: string;
}

// Request cho POST /api/auth/change-password (API-05-03)
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Request cho POST /api/subscriptions/transfer (API-06-01)
export interface TransferPlanRequest {
  sourceVehicleId: number;
  targetVehicleId: number;
}

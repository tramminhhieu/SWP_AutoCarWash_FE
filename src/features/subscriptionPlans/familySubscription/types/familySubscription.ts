/** Status subscription đang có của group */
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELED";

/** 1 gói subscription gia đình — response từ API-16-01 */
export interface FamilySubscriptionPlan {
  id: number;
  planName: string;
  description: string | null;
  price: number; // tổng giá cả kỳ — FE tự tính pricePerMonth
  durationDays: number; // 30 = 1-Month, 90 = 3-Month, 180 = 6-Month
  maxVehicleCount: number;
  servicePackageId: number | null;
  addonIds: number[]; // FE mapping sang tên qua GET /api/addon-services
}

export interface CurrentSubscription {
  familySubscriptionId: number;
  subscriptionPlanId: number;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
}

export interface CurrentGroup {
  familyGroupId: number;
  groupName: string;
  slotsUsed: number;
  subscription: CurrentSubscription | null;
}

/**
 * Response của GET /api/subscriptions/family/plans (API-16-01).
 * currentGroup + familyPlans đều nằm trong data (không phải root).
 */
export interface FamilyPlansData {
  currentGroup: CurrentGroup | null;
  familyPlans: FamilySubscriptionPlan[];
}

export interface FamilyPlansApiResponse {
  success: boolean;
  message: string;
  data: FamilyPlansData;
}

/* ---- Request / Response type cho API-17-02 ---- */
export interface RegisterFamilySubscriptionRequest {
  familyGroupId: number;
  subscriptionPlanId: number;
}

export interface RegisterFamilySubscriptionResponse {
  familySubscriptionId: number;
  invoiceId: number;
  planName: string;
  planPrice: number;
  startDate: string;
  endDate: string;
  status: string;
}

/* ---- Request / Response type cho API-17-04 ---- */
export interface RenewFamilySubscriptionRequest {
  subscriptionPlanId: number;
}

export interface RenewFamilySubscriptionResponse {
  familySubscriptionId: number;
  planName: string;
  planDuration: number;
  status: string;
  startDate: string;
  endDate: string;
  slotsUsed: number;
  maxSlots: number;
  inheritedTierName: string;
}

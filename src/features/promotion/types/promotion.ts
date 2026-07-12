import type { PromotionType, PromotionStatus } from "./enums";

// ====== API-02-01: GET BRANCH PROMOTION SUMMARY ======

export interface BranchPromotionSummary {
  stationId: number;
  stationName: string;
  totalActivePromotions: number;
}

export interface GetBranchSummaryParams {
  status: PromotionStatus;
}

// ====== API-02-02: GET PAGINATED PROMOTION DASHBOARD LIST ======

export interface PromotionDashboardItem {
  id: number;
  type: PromotionType;
  name: string;
  appliedStations: string[];
  targetSegments: string[];
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  // BE cần bổ sung 2 field này để FE biết mode và voucherId khi navigate sang Edit
  configMode: 1 | 2 | 3;
  voucherId: number | null; // null nếu mode 1 (campaign thuần, không có voucher)
  voucherCode: string | null; // null nếu mode 1
}

export interface GetPromotionListParams {
  stationId: number;
  status: PromotionStatus;
  page?: number;
  size?: number;
}

// ====== API-01-01: CREATE PROMOTION OR VOUCHER ======

export type ConfigMode = 1 | 2 | 3;
export type DiscountType = "PERCENTAGE" | "FIXED";

export interface CreatePromotionRequest {
  configMode: ConfigMode;
  campaignName: string | null;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  stationIds: number[] | null;
  voucherCode: string | null;
  usageLimit: number | null;
  reusable: boolean | null;
  voucherStartDate: string | null;
  voucherEndDate: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number;
  minOrderValue: number;
  targetCustomerTierIds: number[] | null;
}

export interface CreatePromotionResponse {
  promotionId: number | null;
  voucherId: number;
  voucherCode: string;
}

// ====== API-03-01: UPDATE CAMPAIGN METADATA ======

export interface UpdateCampaignRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  stationIds: number[];
  targetCustomerTierIds: number[];
}

// ====== API-03-02: UPDATE VOUCHER FINANCIAL RULES ======

export interface UpdateVoucherRequest {
  voucherCode: string;
  discountType: DiscountType;
  discountPercentage: number;
  maxDiscountAmount: number;
  minOrderValue: number;
  usageLimit: number;
  startDate: string; // "2026-07-20T00:00:00"
  expiryDate: string; // "2026-08-25T23:59:59"
  reusable: boolean;
}

// Navigation state truyền từ PromotionDetail → PromotionEdit
export interface PromotionEditNavState {
  configMode: ConfigMode;
  promotionId: number | null;
  voucherId: number | null;
  voucherCode: string | null;
  stationName: string;
  stationId: number;
  // Pre-fill giá trị hiện tại
  currentName: string;
  currentStartDate: string;
  currentEndDate: string;
}

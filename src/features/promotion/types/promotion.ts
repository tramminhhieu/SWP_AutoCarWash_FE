// ====== Enums ======

export type PromotionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED";

// ====== Sub-types (khớp với response API-PR-01) ======

export interface PromotionStation {
  stationId: number;
  stationName: string;
}

export interface PromotionTarget {
  targetId: number;
  targetName: string;
  targetCode: string;
}

export interface PromotionVoucher {
  id: number;
  voucherCode: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string; // "2026-09-01T00:00:00"
  expiryDate: string; // "2026-09-30T23:59:59"
  reusable: boolean;
  status: PromotionStatus;
}

// ====== API-PR-01: GET ALL PROMOTIONS LIST ======

/** 1 item trong danh sách promotion — đủ field để pre-fill form update sau này */
export interface PromotionItem {
  id: number;
  title: string;
  description: string | null;
  startDate: string; // "2026-09-01"
  endDate: string;
  status: PromotionStatus;
  createdAt: string;
  stations: PromotionStation[];
  targets: PromotionTarget[];
  vouchers: PromotionVoucher[];
}

/** Params lọc theo chi nhánh — chỉ truyền 1 trong 2, không truyền cả hai */
export interface GetAdminPromotionsParams {
  provinceId?: number;
  stationId?: number;
}

// ====== API-PR-02: CREATE PROMOTION ======

export interface CreateVoucherPayload {
  voucherCode: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  minOrderValue: number;
  usageLimit: number;
  reusable: boolean;
}

export interface CreatePromotionRequest {
  configMode: 2; // luôn là 2 (Campaign + Voucher)
  campaignName: string;
  campaignStartDate: string;
  campaignEndDate: string;
  stationIds: number[];
  targetIds: number[] | null;
  vouchers: CreateVoucherPayload[];
  voucherStartDate: null; // luôn null — voucher theo ngày của campaign
  voucherEndDate: null;
}

export interface CreatePromotionResponse {
  promotionId: number;
  voucherCodes: string[];
}

// ====== API-PR-03: UPDATE PROMOTION ======

export interface UpdateVoucherPayload {
  id: number | null; // có id = update voucher cũ, null = tạo voucher mới
  voucherCode: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  minOrderValue: number;
  usageLimit: number;
  reusable: boolean;
}

export interface UpdatePromotionRequest {
  title: string;
  startDate: string;
  endDate: string;
  stationIds: number[];
  targetIds: number[] | null;
  vouchers: UpdateVoucherPayload[]; // voucher không có trong list => BE tự soft delete
}

// ====== PromotionForm — dùng chung cho Create & Edit ======

export interface VoucherFormItem {
  key: string; // local key cho React list
  id: number | null; // null = voucher mới, có id = voucher cũ (dùng cho update)
  voucherCode: string;
  discountPercentage: string;
  maxDiscountAmount: string;
  minOrderValue: string;
  usageLimit: number | string;
  reusable: boolean;
}

export interface PromotionFormValues {
  campaignName: string;
  startDate: string;
  endDate: string;
  selectedStations: { id: number; name: string }[];
  targetIds: number[];
  vouchers: VoucherFormItem[];
}

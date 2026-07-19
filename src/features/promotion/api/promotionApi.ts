import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  PromotionItem,
  PromotionVoucher,
  GetAdminPromotionsParams,
  CreatePromotionRequest,
  CreatePromotionResponse,
  UpdatePromotionRequest,
} from "../types/promotion";

// ── Chuẩn hóa response từ BE ──────────────────────────────────────────────────
// BE trả về danh sách/chi tiết promotion với field "discountPercentage" (nullable)
// thay vì discountType/discountValue:
//   - discountPercentage có giá trị => voucher loại PERCENTAGE, discountValue = discountPercentage
//   - discountPercentage = null     => voucher loại FIXED, discountValue = maxDiscountAmount
// Lưu ý: chỉ áp dụng cho chiều đọc (GET List/Detail).
// Chiều ghi (Create/Update) vẫn gửi discountType + discountValue theo API đã chốt.

/** Voucher đúng như BE thực tế trả về (chưa chuẩn hóa) */
type RawVoucher = Omit<PromotionVoucher, "discountType" | "discountValue"> & {
  discountPercentage: number | null;
};

/** Promotion đúng như BE thực tế trả về (chưa chuẩn hóa) */
type RawPromotion = Omit<PromotionItem, "vouchers"> & {
  vouchers: RawVoucher[];
};

function normalizeVoucher(raw: RawVoucher): PromotionVoucher {
  const isPercentage = raw.discountPercentage !== null;
  return {
    ...raw,
    discountType: isPercentage ? "PERCENTAGE" : "FIXED",
    discountValue: isPercentage
      ? raw.discountPercentage!
      : raw.maxDiscountAmount,
  };
}

function normalizePromotion(raw: RawPromotion): PromotionItem {
  return {
    ...raw,
    vouchers: (raw.vouchers ?? []).map(normalizeVoucher),
  };
}

// API-PR-01: Lấy toàn bộ danh sách promotion
export const getAdminPromotions = async (
  params?: GetAdminPromotionsParams,
): Promise<PromotionItem[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<RawPromotion[]>>(
    API.PROMOTION.LIST,
    { params },
  );
  return (res.data.data ?? []).map(normalizePromotion);
};

// API-PR-01 (detail): Lấy 1 promotion theo id
export const getPromotionById = async (
  id: number,
): Promise<PromotionItem | null> => {
  const res = await axiosClient.get<ApiSuccessResponse<RawPromotion>>(
    `${API.PROMOTION.LIST}/${id}`,
  );
  return res.data.data ? normalizePromotion(res.data.data) : null;
};

// API-PR-02: Tạo promotion mới (Campaign + Voucher, luôn configMode = 2)
// Vẫn gửi discountType + discountValue theo API đã chốt — không đổi.
export const createPromotion = async (
  body: CreatePromotionRequest,
): Promise<CreatePromotionResponse> => {
  const res = await axiosClient.post<
    ApiSuccessResponse<CreatePromotionResponse>
  >(API.PROMOTION.CREATE, body);
  return res.data.data;
};

// API-PR-03: Cập nhật promotion (campaign info + vouchers)
// Vẫn gửi discountType + discountValue theo API đã chốt — không đổi.
export const updatePromotion = async (
  promotionId: number,
  body: UpdatePromotionRequest,
): Promise<void> => {
  await axiosClient.put(`${API.PROMOTION.LIST}/${promotionId}`, body);
};

// Soft delete toàn bộ campaign + voucher con
export const softDeleteCampaign = async (
  promotionId: number,
): Promise<void> => {
  await axiosClient.patch(
    `${API.PROMOTION.SOFT_DELETE_CAMPAIGN}/${promotionId}/soft-delete`,
  );
};

// Soft delete 1 voucher riêng lẻ
export const softDeleteVoucher = async (voucherId: number): Promise<void> => {
  await axiosClient.patch(
    `${API.PROMOTION.SOFT_DELETE_VOUCHER}/${voucherId}/soft-delete`,
  );
};

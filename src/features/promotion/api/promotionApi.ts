import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  BranchPromotionSummary,
  GetBranchSummaryParams,
  PromotionDashboardItem,
  GetPromotionListParams,
  CreatePromotionRequest,
  CreatePromotionResponse,
  UpdateCampaignRequest,
  UpdateVoucherRequest,
} from "../types/promotion";

// API-02-01
export const getBranchPromotionSummary = async (
  params: GetBranchSummaryParams,
): Promise<BranchPromotionSummary[]> => {
  const res = await axiosClient.get<
    ApiSuccessResponse<BranchPromotionSummary[]>
  >(API.PROMOTION.BRANCHES_SUMMARY, { params });
  return res.data.data ?? [];
};

// API-02-02
export const getPromotionDashboardList = async (
  params: GetPromotionListParams,
): Promise<PromotionDashboardItem[]> => {
  const res = await axiosClient.get<
    ApiSuccessResponse<PromotionDashboardItem[]>
  >(API.PROMOTION.DASHBOARD_LIST, { params });
  return res.data.data ?? [];
};

// API-01-01
export const createPromotion = async (
  body: CreatePromotionRequest,
): Promise<CreatePromotionResponse> => {
  const res = await axiosClient.post<
    ApiSuccessResponse<CreatePromotionResponse>
  >(API.PROMOTION.CREATE, body);
  return res.data.data;
};

// API-03-01: cập nhật metadata chiến dịch (title, dates, stations, tiers)
export const updateCampaign = async (
  promotionId: number,
  body: UpdateCampaignRequest,
): Promise<void> => {
  await axiosClient.put(
    `${API.PROMOTION.UPDATE_CAMPAIGN}/${promotionId}`,
    body,
  );
};

// API-03-02: cập nhật luật tài chính voucher (discount, code, limit, dates)
export const updateVoucher = async (
  voucherId: number,
  body: UpdateVoucherRequest,
): Promise<void> => {
  await axiosClient.put(`${API.PROMOTION.UPDATE_VOUCHER}/${voucherId}`, body);
};

// Soft delete campaign + toàn bộ voucher liên kết
export const softDeleteCampaign = async (
  promotionId: number,
): Promise<void> => {
  await axiosClient.patch(
    `${API.PROMOTION.SOFT_DELETE_CAMPAIGN}/${promotionId}/soft-delete`,
  );
};

// Soft delete voucher lẻ độc lập
export const softDeleteVoucher = async (voucherId: number): Promise<void> => {
  await axiosClient.patch(
    `${API.PROMOTION.SOFT_DELETE_VOUCHER}/${voucherId}/soft-delete`,
  );
};

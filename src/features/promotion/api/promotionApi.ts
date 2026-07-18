import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  PromotionItem,
  GetAdminPromotionsParams,
  CreatePromotionRequest,
  CreatePromotionResponse,
  UpdatePromotionRequest,
} from "../types/promotion";

// ── Mock data — xóa khi BE sẵn sàng ──────────────────────────────────────────
const MOCK_PROMOTIONS: PromotionItem[] = [
  {
    id: 15,
    title: "Chiến dịch Chào Thu 2026",
    description: "Mô tả chiến dịch...",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    status: "ACTIVE",
    createdAt: "2026-07-01T10:00:00",
    stations: [
      {
        stationId: 1,
        stationName: "HCM - Quận 1",
      },
      {
        stationId: 2,
        stationName: "HCM - Quận 7",
      },
    ],
    targets: [
      {
        targetId: 1,
        targetName: "Hạng Vàng",
        targetCode: "GOLD",
      },
      {
        targetId: 2,
        targetName: "Khách hàng mới",
        targetCode: "NEW_CUSTOMER",
      },
    ],
    vouchers: [
      {
        id: 101,
        voucherCode: "AUTUMN2026",
        discountPercentage: 15,
        maxDiscountAmount: 50000,
        minOrderValue: 100000,
        usageLimit: 200,
        usedCount: 50,
        startDate: "2026-09-01T00:00:00",
        expiryDate: "2026-09-30T23:59:59",
        reusable: true,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: 16,
    title: "Ưu đãi Khai trương Bình Thạnh",
    description: "Giảm giá cho khách hàng mới.",
    startDate: "2026-08-10",
    endDate: "2026-08-31",
    status: "ACTIVE",
    createdAt: "2026-07-05T09:30:00",
    stations: [
      {
        stationId: 3,
        stationName: "HCM - Bình Thạnh",
      },
    ],
    targets: [
      {
        targetId: 2,
        targetName: "Khách hàng mới",
        targetCode: "NEW_CUSTOMER",
      },
    ],
    vouchers: [
      {
        id: 102,
        voucherCode: "WELCOME20",
        discountPercentage: 20,
        maxDiscountAmount: 100000,
        minOrderValue: 200000,
        usageLimit: 500,
        usedCount: 80,
        startDate: "2026-08-10T00:00:00",
        expiryDate: "2026-08-31T23:59:59",
        reusable: false,
        status: "ACTIVE",
      },
    ],
  },
];

// API-PR-01: Lấy toàn bộ danh sách promotion
// TODO: xóa MOCK_PROMOTIONS và dòng return mock, bỏ comment axiosClient khi BE xong
export const getAdminPromotions = async (
  params?: GetAdminPromotionsParams,
): Promise<PromotionItem[]> => {
  void params;
  return Promise.resolve(MOCK_PROMOTIONS);

  // const res = await axiosClient.get<ApiSuccessResponse<PromotionItem[]>>(
  //   API.PROMOTION.LIST,
  //   { params },
  // );
  // return res.data.data ?? [];
};

// Tìm 1 promotion theo id từ mock — thay bằng API thật khi BE có GET /api/admin/promotions/:id
export const getPromotionById = async (
  id: number,
): Promise<PromotionItem | null> => {
  return Promise.resolve(MOCK_PROMOTIONS.find((p) => p.id === id) ?? null);

  // const res = await axiosClient.get<ApiSuccessResponse<PromotionItem>>(
  //   `${API.PROMOTION.LIST}/${id}`,
  // );
  // return res.data.data;
};

// API-PR-02: Tạo promotion mới (Campaign + Voucher, luôn configMode = 2)
export const createPromotion = async (
  body: CreatePromotionRequest,
): Promise<CreatePromotionResponse> => {
  const res = await axiosClient.post<
    ApiSuccessResponse<CreatePromotionResponse>
  >(API.PROMOTION.CREATE, body);
  return res.data.data;
};

// API-PR-03: Cập nhật promotion (campaign info + vouchers)
// Lưu ý: apiEndpoints.ts hiện chưa có key riêng cho UPDATE — LIST và CREATE
// đều trỏ chung "/api/admin/promotions" nên dùng tạm API.PROMOTION.LIST làm base.
// Nếu sau này tách riêng, đổi thành API.PROMOTION.UPDATE cho rõ nghĩa.
export const updatePromotion = async (
  promotionId: number,
  body: UpdatePromotionRequest,
): Promise<void> => {
  await axiosClient.patch(`${API.PROMOTION.LIST}/${promotionId}`, body);
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

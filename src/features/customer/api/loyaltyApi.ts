// API cho Loyalty feature: profile, history, tiers
// Xem AutoWash API.postman_collection.json (folder "Loyalty")
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  LoyaltyProfile,
  LoyaltyTier,
  LoyaltyHistory,
  TierHistoryEntry,
} from "../types/loyalty";

// GET /api/loyalty/profile
export async function getLoyaltyProfile(): Promise<LoyaltyProfile> {
  const res = await axiosClient.get<ApiSuccessResponse<LoyaltyProfile>>(
    API.LOYALTY.PROFILE,
  );
  return res.data.data;
}

// GET /api/loyalty/tiers
export async function getLoyaltyTiers(): Promise<LoyaltyTier[]> {
  const res = await axiosClient.get<ApiSuccessResponse<LoyaltyTier[]>>(
    API.LOYALTY.TIERS,
  );
  return res.data.data;
}

// GET /api/loyalty/tier-history?year=&month=
export async function getTierHistory(
  year: number,
  month?: number,
): Promise<TierHistoryEntry[]> {
  const res = await axiosClient.get<ApiSuccessResponse<TierHistoryEntry[]>>(
    API.LOYALTY.TIER_HISTORY,
    { params: month ? { year, month } : { year } },
  );
  return res.data.data;
}

// GET /api/loyalty/history?year=&month=
export async function getLoyaltyHistory(
  year: number,
  month?: number,
): Promise<LoyaltyHistory> {
  const res = await axiosClient.get<ApiSuccessResponse<LoyaltyHistory>>(
    API.LOYALTY.HISTORY,
    { params: month ? { year, month } : { year } },
  );
  return res.data.data;
}

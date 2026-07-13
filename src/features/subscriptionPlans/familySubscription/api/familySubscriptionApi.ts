import axiosClient from "../../../../lib/axiosClient";
import { API } from "../../../../constants/apiEndpoints";
import type {
  FamilyPlansApiResponse,
  RegisterFamilySubscriptionRequest,
  RegisterFamilySubscriptionResponse,
  RenewFamilySubscriptionRequest,
  RenewFamilySubscriptionResponse,
} from "../types/familySubscription";

/** GET /api/subscriptions/family/plans — public endpoint (API-16-01). */
export async function getFamilySubscriptionPlans(): Promise<FamilyPlansApiResponse> {
  const res = await axiosClient.get<FamilyPlansApiResponse>(
    API.SUBSCRIPTIONS.FAMILY_PLANS,
  );
  return res.data;
}

/** POST /api/subscriptions/family — đăng ký gói Family lần đầu (API-17-02). */
export async function registerFamilySubscription(
  body: RegisterFamilySubscriptionRequest,
): Promise<RegisterFamilySubscriptionResponse> {
  const res = await axiosClient.post<{
    success: boolean;
    data: RegisterFamilySubscriptionResponse;
  }>(API.SUBSCRIPTIONS.FAMILY_REGISTER, body);
  return res.data.data;
}

/** POST /api/subscriptions/family/renew — gia hạn hoặc mua gói mới (API-17-04). */
export async function renewFamilySubscription(
  body: RenewFamilySubscriptionRequest,
): Promise<RenewFamilySubscriptionResponse> {
  const res = await axiosClient.post<{
    success: boolean;
    data: RenewFamilySubscriptionResponse;
  }>(API.SUBSCRIPTIONS.FAMILY_RENEW, body);
  return res.data.data;
}

/** PATCH /api/subscriptions/family/cancel — hủy gói Family (API-17-03). */
export async function cancelFamilySubscription(): Promise<void> {
  await axiosClient.patch(API.SUBSCRIPTIONS.FAMILY_CANCEL);
}

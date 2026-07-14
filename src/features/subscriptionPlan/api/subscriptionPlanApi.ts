import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  CreateSubscriptionPlanRequest,
  PlanStatusFilter,
  PlanTypeFilter,
  ServicePackageOption,
  SubscriptionPlan,
  SubscriptionPlanDetail,
  UpdateSubscriptionPlanRequest,
  FamilyPlansApiResponse,
  RegisterFamilySubscriptionRequest,
  RegisterFamilySubscriptionResponse,
  RenewFamilySubscriptionRequest,
  RenewFamilySubscriptionResponse,
} from "../types/subscriptionPlan";

// AC02 US-02: dropdown chỉ hiển thị service package ACTIVE - BE đã lọc sẵn ACTIVE ở endpoint này
export const getServicePackageOptions = async (): Promise<
  ServicePackageOption[]
> => {
  const res = await axiosClient.get<ApiSuccessResponse<ServicePackageOption[]>>(
    API.ADMIN.SERVICE_PACKAGE.ACTIVE,
  );
  return res.data.data.map((p) => ({ id: p.id, name: p.name }));
};

// FE-53-US-01
export const getAll = async (
  status: PlanStatusFilter = "ALL",
  type: PlanTypeFilter = "ALL",
): Promise<SubscriptionPlan[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<SubscriptionPlan[]>>(
    API.ADMIN.SUBSCRIPTION_PLAN.LIST,
    { params: { status, type } },
  );
  return res.data.data;
};

// FE-53-US-03 AC01
export const getById = async (id: number): Promise<SubscriptionPlanDetail> => {
  const res = await axiosClient.get<ApiSuccessResponse<SubscriptionPlanDetail>>(
    API.ADMIN.SUBSCRIPTION_PLAN.DETAIL(id),
  );
  return res.data.data;
};

// FE-53-US-02
export const create = async (
  data: CreateSubscriptionPlanRequest,
): Promise<ApiSuccessResponse<unknown>> => {
  const res = await axiosClient.post<ApiSuccessResponse<unknown>>(
    API.ADMIN.SUBSCRIPTION_PLAN.CREATE,
    data,
  );
  return res.data;
};

// FE-53-US-03
export const update = async (
  id: number,
  data: UpdateSubscriptionPlanRequest,
): Promise<ApiSuccessResponse<unknown>> => {
  const res = await axiosClient.put<ApiSuccessResponse<unknown>>(
    API.ADMIN.SUBSCRIPTION_PLAN.UPDATE(id),
    data,
  );
  return res.data;
};

// FE-53-US-04 (soft delete -> status = INACTIVE)
export const remove = async (
  id: number,
): Promise<ApiSuccessResponse<unknown>> => {
  const res = await axiosClient.delete<ApiSuccessResponse<unknown>>(
    API.ADMIN.SUBSCRIPTION_PLAN.DELETE(id),
  );
  return res.data;
};

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

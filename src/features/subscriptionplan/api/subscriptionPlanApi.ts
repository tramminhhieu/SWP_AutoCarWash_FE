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
} from "../types/subscriptionPlan";

// AC02 US-02: dropdown chỉ hiển thị service package ACTIVE - BE đã lọc sẵn ACTIVE ở endpoint này
export const getServicePackageOptions = async (): Promise<ServicePackageOption[]> => {
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
export const remove = async (id: number): Promise<ApiSuccessResponse<unknown>> => {
  const res = await axiosClient.delete<ApiSuccessResponse<unknown>>(
    API.ADMIN.SUBSCRIPTION_PLAN.DELETE(id),
  );
  return res.data;
};

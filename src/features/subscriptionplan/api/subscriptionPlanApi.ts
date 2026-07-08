import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import * as servicePackageApi from "../../servicepackage/api/servicePackageApi";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  CreateSubscriptionPlanRequest,
  PlanStatusFilter,
  ServicePackageOption,
  SubscriptionPlan,
  SubscriptionPlanDetail,
  UpdateSubscriptionPlanRequest,
} from "../types/subscriptionPlan";

// AC02 US-02: dropdown chỉ hiển thị service package ACTIVE
export const getServicePackageOptions = async (): Promise<ServicePackageOption[]> => {
  const packages = await servicePackageApi.getAll();
  return packages
    .filter((p) => p.status !== "INACTIVE")
    .map((p) => ({ id: p.id, name: p.name }));
};

// FE-53-US-01
export const getAll = async (
  status: PlanStatusFilter = "ALL",
): Promise<SubscriptionPlan[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<SubscriptionPlan[]>>(
    API.ADMIN.SUBSCRIPTION_PLAN.LIST,
    { params: { status } },
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

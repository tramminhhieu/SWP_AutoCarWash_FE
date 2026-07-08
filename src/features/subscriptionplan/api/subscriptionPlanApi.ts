import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  CreateSubscriptionPlanRequest,
  PlanStatusFilter,
  ServicePackageOption,
  SubscriptionPlan,
  SubscriptionPlanDetail,
  UpdateSubscriptionPlanRequest,
} from "../types/subscriptionPlan";

// ⚠️ MOCK DATA tạm thời để demo/test UI FE-53 - BE chưa có endpoint
// /api/admin/subscription-plans nên toàn bộ list/create/update/delete dưới đây thao tác
// trực tiếp trên mảng in-memory (mất khi F5 trang). Khi BE xong, xoá phần MOCK và bật lại
// phần "REAL API" đã viết sẵn (comment cuối file) - KHÔNG cần sửa các trang đang import các
// hàm getAll/getById/create/update/remove/getServicePackageOptions vì signature giữ nguyên.

// Service package mock - lấy đúng tên/id theo bảng service_package thật trong data.sql
// (id 1 Basic, id 2 Medium, id 3 Premium, service_category_id = 1 "Single Wash").
// Coi cả 3 gói đang ACTIVE (data.sql: is_deleted = false), theo AC02 US-02.
const MOCK_SERVICE_PACKAGES: ServicePackageOption[] = [
  { id: 1, name: "Basic" },
  { id: 2, name: "Medium" },
  { id: 3, name: "Premium" },
];

interface MockPlan {
  id: number;
  planName: string;
  price: number;
  durationDays: number;
  planType: "FAMILY" | "UNLIMITED";
  description: string;
  maxVehicleCount: number | null;
  servicePackageId: number;
  status: "ACTIVE" | "INACTIVE";
}

// Data mẫu lấy đúng cả 12 dòng thật trong bảng subscription_plan (data.sql), khớp cột
// (service_package_id, service_category_id, plan_name, duration_days, price, plan_type,
// max_vehicle_count, description, is_deleted). 11/12 dòng thật đều is_deleted=false -> ACTIVE;
// riêng id 12 mock cố tình để INACTIVE (data.sql thật là ACTIVE) để tab filter INACTIVE có
// data test ngay, không cần tự bấm Delete trước.
// Trước đó mock chỉ có 2 dòng (id 2, 6) và gán nhầm id 6 = INACTIVE dù data.sql thật là
// is_deleted=false - QA audit 2026-07-08 phát hiện mock quá mỏng để test filter tabs, sửa
// lại đủ 12 dòng + đúng status thật ở đây.
let mockPlans: MockPlan[] = [
  { id: 1, planName: "Unlimited Basic 1 Month", price: 500000, durationDays: 30, planType: "UNLIMITED", description: "Rua xe khong gioi han trong 1 thang", maxVehicleCount: 1, servicePackageId: 1, status: "ACTIVE" },
  { id: 2, planName: "Unlimited Premium 1 Month", price: 900000, durationDays: 30, planType: "UNLIMITED", description: "Rua xe cao cap khong gioi han trong 1 thang", maxVehicleCount: 1, servicePackageId: 3, status: "ACTIVE" },
  { id: 3, planName: "Unlimited Basic 3 Months", price: 1350000, durationDays: 90, planType: "UNLIMITED", description: "Rua xe khong gioi han trong 3 thang", maxVehicleCount: 1, servicePackageId: 1, status: "ACTIVE" },
  { id: 4, planName: "Unlimited Premium 3 Months", price: 2400000, durationDays: 90, planType: "UNLIMITED", description: "Rua xe cao cap khong gioi han trong 3 thang", maxVehicleCount: 1, servicePackageId: 3, status: "ACTIVE" },
  { id: 5, planName: "Unlimited Premium 6 Months", price: 4800000, durationDays: 180, planType: "UNLIMITED", description: "Rua xe cao cap khong gioi han trong 6 thang", maxVehicleCount: 1, servicePackageId: 3, status: "ACTIVE" },
  { id: 6, planName: "Family Basic 1 Month", price: 1200000, durationDays: 30, planType: "FAMILY", description: "Rua xe khong gioi han cho ca gia dinh, 1 thang", maxVehicleCount: 3, servicePackageId: 1, status: "ACTIVE" },
  { id: 7, planName: "Family Premium 1 Month", price: 2000000, durationDays: 30, planType: "FAMILY", description: "Rua xe cao cap cho ca gia dinh, 1 thang", maxVehicleCount: 3, servicePackageId: 3, status: "ACTIVE" },
  { id: 8, planName: "Family Basic 3 Months", price: 3200000, durationDays: 90, planType: "FAMILY", description: "Rua xe khong gioi han cho ca gia dinh, 3 thang", maxVehicleCount: 4, servicePackageId: 1, status: "ACTIVE" },
  { id: 9, planName: "Family Premium 3 Months", price: 5400000, durationDays: 90, planType: "FAMILY", description: "Rua xe cao cap cho ca gia dinh, 3 thang", maxVehicleCount: 4, servicePackageId: 3, status: "ACTIVE" },
  { id: 10, planName: "Family Premium 6 Months", price: 10800000, durationDays: 180, planType: "FAMILY", description: "Rua xe cao cap cho ca gia dinh, 6 thang", maxVehicleCount: 5, servicePackageId: 3, status: "ACTIVE" },
  { id: 11, planName: "Unlimited Basic 6 Months", price: 2700000, durationDays: 180, planType: "UNLIMITED", description: "Rua xe khong gioi han trong 6 thang", maxVehicleCount: 1, servicePackageId: 1, status: "ACTIVE" },
  { id: 12, planName: "Family Basic 6 Months", price: 6500000, durationDays: 180, planType: "FAMILY", description: "Rua xe khong gioi han cho ca gia dinh, 6 thang", maxVehicleCount: 3, servicePackageId: 1, status: "INACTIVE" },
];

let nextId = 100; // tránh trùng id thật trong data.sql (subscription_plan có id 1-12)

const delay = <T,>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const servicePackageName = (servicePackageId: number): string =>
  MOCK_SERVICE_PACKAGES.find((p) => p.id === servicePackageId)?.name ??
  "Unknown Package";

const toListItem = (p: MockPlan): SubscriptionPlan => ({
  id: p.id,
  planName: p.planName,
  price: p.price,
  durationDays: p.durationDays,
  planType: p.planType,
  description: p.description,
  maxVehicleCount: p.maxVehicleCount,
  servicePackageName: servicePackageName(p.servicePackageId),
  status: p.status,
});

const toDetail = (p: MockPlan): SubscriptionPlanDetail => ({
  id: p.id,
  planName: p.planName,
  price: p.price,
  durationDays: p.durationDays,
  description: p.description,
  servicePackageId: p.servicePackageId,
  planType: p.planType,
  maxVehicleCount: p.maxVehicleCount,
  status: p.status,
});

// AC02 US-02: dropdown chỉ hiển thị service package ACTIVE - mock coi cả 3 gói đều ACTIVE
export const getServicePackageOptions = (): Promise<ServicePackageOption[]> =>
  delay(MOCK_SERVICE_PACKAGES);

// FE-53-US-01
export const getAll = (
  status: PlanStatusFilter = "ALL",
): Promise<SubscriptionPlan[]> => {
  const filtered =
    status === "ALL" ? mockPlans : mockPlans.filter((p) => p.status === status);
  return delay(filtered.map(toListItem));
};

// FE-53-US-03 AC01
export const getById = (id: number): Promise<SubscriptionPlanDetail> => {
  const plan = mockPlans.find((p) => p.id === id);
  if (!plan) {
    return Promise.reject({
      response: {
        data: {
          success: false,
          message: "Subscription plan not found.",
          errorCode: "SUBSCRIPTION_PLAN_NOT_FOUND",
        },
      },
    });
  }
  return delay(toDetail(plan));
};

// FE-53-US-02
export const create = (
  data: CreateSubscriptionPlanRequest,
): Promise<ApiSuccessResponse<unknown>> => {
  const newPlan: MockPlan = {
    id: nextId++,
    ...data,
    status: "ACTIVE",
  };
  mockPlans = [...mockPlans, newPlan];
  return delay({
    success: true,
    message: "Subscription plan created successfully.",
    data: {},
  });
};

// FE-53-US-03
export const update = (
  id: number,
  data: UpdateSubscriptionPlanRequest,
): Promise<ApiSuccessResponse<unknown>> => {
  mockPlans = mockPlans.map((p) => (p.id === id ? { ...p, ...data } : p));
  return delay({
    success: true,
    message: "Subscription plan updated successfully.",
    data: {},
  });
};

// FE-53-US-04 (soft delete -> status = INACTIVE)
export const remove = (id: number): Promise<ApiSuccessResponse<unknown>> => {
  mockPlans = mockPlans.map((p) => (p.id === id ? { ...p, status: "INACTIVE" } : p));
  return delay({
    success: true,
    message: "Subscription plan deleted successfully.",
    data: {},
  });
};

/* ───────────────── REAL API (bật lại khi BE có endpoint) ─────────────────

import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";

export const getAll = async (status: PlanStatusFilter = "ALL") => {
  const res = await axiosClient.get<ApiSuccessResponse<SubscriptionPlan[]>>(
    API.ADMIN.SUBSCRIPTION_PLAN.LIST,
    { params: { status } },
  );
  return res.data.data;
};

export const getById = async (id: number) => {
  const res = await axiosClient.get<ApiSuccessResponse<SubscriptionPlanDetail>>(
    API.ADMIN.SUBSCRIPTION_PLAN.DETAIL(id),
  );
  return res.data.data;
};

export const create = async (data: CreateSubscriptionPlanRequest) => {
  const res = await axiosClient.post<ApiSuccessResponse<unknown>>(
    API.ADMIN.SUBSCRIPTION_PLAN.CREATE,
    data,
  );
  return res.data;
};

export const update = async (id: number, data: UpdateSubscriptionPlanRequest) => {
  const res = await axiosClient.put<ApiSuccessResponse<unknown>>(
    API.ADMIN.SUBSCRIPTION_PLAN.UPDATE(id),
    data,
  );
  return res.data;
};

export const remove = async (id: number) => {
  const res = await axiosClient.delete<ApiSuccessResponse<unknown>>(
    API.ADMIN.SUBSCRIPTION_PLAN.DELETE(id),
  );
  return res.data;
};

// getServicePackageOptions thật: dùng lại features/servicepackage/api/servicePackageApi.ts
// (getAll) rồi lọc status !== "INACTIVE", map sang { id, name }.

────────────────────────────────────────────────────────────────────────── */

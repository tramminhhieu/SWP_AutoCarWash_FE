// ─── analyticsApi.ts ─────────────────────────────────────────────────────────
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";

import type {
  DashboardFilterParams,
  DashboardSummary,
  DashboardRevenueChart,
  DashboardTables,
} from "../types/dashboard";

// ─── API-16-01: GET DASHBOARD SUMMARY ────────────────────────────────────────
export async function getDashboardSummary(
  params: Omit<DashboardFilterParams, "groupBy">,
): Promise<DashboardSummary> {
  const res = await axiosClient.get<ApiSuccessResponse<DashboardSummary>>(
    API.DASHBOARD.SUMMARY,
    { params },
  );
  return res.data.data;
}

// ─── API-16-02: GET REVENUE CHART ─────────────────────────────────────────────
export async function getDashboardRevenueChart(
  params: DashboardFilterParams,
): Promise<DashboardRevenueChart> {
  const res = await axiosClient.get<ApiSuccessResponse<DashboardRevenueChart>>(
    API.DASHBOARD.REVENUE_CHART,
    { params },
  );
  return res.data.data;
}

// ─── API-16-03: GET DASHBOARD TABLES ─────────────────────────────────────────
export async function getDashboardTables(
  params: Omit<DashboardFilterParams, "groupBy">,
): Promise<DashboardTables> {
  const res = await axiosClient.get<ApiSuccessResponse<DashboardTables>>(
    API.DASHBOARD.TABLES,
    { params },
  );
  return res.data.data;
}

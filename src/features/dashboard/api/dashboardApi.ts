// ─── analyticsApi.ts ─────────────────────────────────────────────────────────
// Hiện tại dùng mock data. Khi có BE: xóa mock, bỏ comment axios call.
// import axiosClient from '../../../lib/axiosClient';
// import { API } from '../../../constants/apiEndpoints';
// import type { ApiSuccessResponse } from '../../../types/apiResponse';

import type {
  DashboardFilterParams,
  DashboardSummary,
  DashboardRevenueChart,
  DashboardTables,
  ProvinceOption,
  StationOption,
} from "../types/dashboard";

// Giả lập network latency
const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY: DashboardSummary = {
  totalRevenue: 1348250000,
  totalBookings: 14204,
  totalCustomers: 2132,
};

const MOCK_REVENUE_CHART_YEAR: DashboardRevenueChart = {
  revenueTotal: 124592000,
  chartData: [
    { label: "JAN", value: 28000000 },
    { label: "FEB", value: 20000000 },
    { label: "MAR", value: 22000000 },
    { label: "APR", value: 11000000 },
    { label: "MAY", value: 31000000 },
    { label: "JUN", value: 0 },
    { label: "JUL", value: 35000000 },
    { label: "AUG", value: 33000000 },
    { label: "SEP", value: 27000000 },
    { label: "OCT", value: 26000000 },
    { label: "NOV", value: 38000000 },
    { label: "DEC", value: 31000000 },
  ],
};

const MOCK_REVENUE_CHART_TODAY: DashboardRevenueChart = {
  revenueTotal: 8500000,
  chartData: [
    { label: "08:00", value: 200000 },
    { label: "09:00", value: 450000 },
    { label: "10:00", value: 800000 },
    { label: "11:00", value: 1200000 },
    { label: "12:00", value: 1500000 },
    { label: "13:00", value: 1100000 },
    { label: "14:00", value: 900000 },
    { label: "15:00", value: 750000 },
    { label: "16:00", value: 600000 },
    { label: "17:00", value: 400000 },
    { label: "18:00", value: 300000 },
    { label: "19:00", value: 200000 },
    { label: "20:00", value: 100000 },
  ],
};

const MOCK_REVENUE_CHART_QUARTER: DashboardRevenueChart = {
  revenueTotal: 303000000,
  chartData: [
    { label: "Q1", value: 70000000 },
    { label: "Q2", value: 43000000 },
    { label: "Q3", value: 95000000 },
    { label: "Q4", value: 95000000 },
  ],
};

const MOCK_TABLES: DashboardTables = {
  packageStats: [
    { packageName: "Standard Clean", bookingCount: 1117, percentage: 45 },
    { packageName: "Premium Detail", bookingCount: 745, percentage: 30 },
    { packageName: "Basic Wash", bookingCount: 620, percentage: 25 },
  ],
  tierStats: [
    { tier: "MEMBER", customerCount: 980 },
    { tier: "SILVER", customerCount: 650 },
    { tier: "GOLD", customerCount: 380 },
    { tier: "PLATINUM", customerCount: 122 },
  ],
};

const MOCK_PROVINCES: ProvinceOption[] = [
  { provinceId: 1, provinceName: "Hồ Chí Minh" },
  { provinceId: 2, provinceName: "Hà Nội" },
  { provinceId: 3, provinceName: "Đà Nẵng" },
];

const MOCK_STATIONS: StationOption[] = [
  { stationId: 1, stationName: "HydroLux Quận 1", provinceId: 1 },
  { stationId: 2, stationName: "HydroLux Bình Thạnh", provinceId: 1 },
  { stationId: 3, stationName: "HydroLux Cầu Giấy", provinceId: 2 },
  { stationId: 4, stationName: "HydroLux Đống Đa", provinceId: 2 },
  { stationId: 5, stationName: "HydroLux Hải Châu", provinceId: 3 },
];

// ─── API-16-01: GET DASHBOARD SUMMARY ────────────────────────────────────────
export async function getDashboardSummary(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _params: Omit<DashboardFilterParams, "groupBy">,
): Promise<DashboardSummary> {
  await delay(200);
  return MOCK_SUMMARY;
  // TODO: dùng thật khi có BE
  // const res = await axiosClient.get<ApiSuccessResponse<DashboardSummary>>(
  //   API.DASHBOARD.SUMMARY, { params: _params }
  // );
  // return res.data.data;
}

// ─── API-16-02: GET REVENUE CHART ─────────────────────────────────────────────
export async function getDashboardRevenueChart(
  params: DashboardFilterParams,
): Promise<DashboardRevenueChart> {
  await delay(250);
  // Trả mock theo groupBy để thấy sự khác biệt khi đổi tab
  switch (params.groupBy) {
    case "HOUR":
      return MOCK_REVENUE_CHART_TODAY;
    case "QUARTER":
      return MOCK_REVENUE_CHART_QUARTER;
    default:
      return MOCK_REVENUE_CHART_YEAR;
  }
  // TODO: dùng thật khi có BE
  // const res = await axiosClient.get<ApiSuccessResponse<DashboardRevenueChart>>(
  //   API.DASHBOARD.REVENUE_CHART, { params }
  // );
  // return res.data.data;
}

// ─── API-16-03: GET DASHBOARD TABLES ─────────────────────────────────────────
export async function getDashboardTables(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _params: Omit<DashboardFilterParams, "groupBy">,
): Promise<DashboardTables> {
  await delay(200);
  return MOCK_TABLES;
  // TODO: dùng thật khi có BE
  // const res = await axiosClient.get<ApiSuccessResponse<DashboardTables>>(
  //   API.DASHBOARD.TABLES, { params: _params }
  // );
  // return res.data.data;
}

// ─── Province / Station cho filter dropdown (ADMIN) ──────────────────────────
export async function getProvinces(): Promise<ProvinceOption[]> {
  await delay(100);
  return MOCK_PROVINCES;
  // TODO: import từ stationApi khi có BE
  // return stationApi.getProvinces();
}

export async function getStationsByProvince(
  provinceId: number,
): Promise<StationOption[]> {
  await delay(100);
  return MOCK_STATIONS.filter((s) => s.provinceId === provinceId);
  // TODO: import từ stationApi khi có BE
  // return stationApi.getStationsByProvince(provinceId);
}

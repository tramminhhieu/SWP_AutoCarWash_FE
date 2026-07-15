// ─── Types dùng chung cho toàn bộ dashboard module ───────────────────────────

export type GroupBy = "HOUR" | "DAY" | "QUARTER" | "MONTH";
export type DashboardTab = "today" | "month" | "quarter" | "year";

// Params gửi lên cho cả 3 API (groupBy chỉ dùng cho API-16-02)
export interface DashboardFilterParams {
  fromDate: string; // format YYYY-MM-DD
  toDate: string;
  groupBy: GroupBy;
  provinceId?: number;
  stationId?: number;
}

// ─── API-16-01: Summary Cards ─────────────────────────────────────────────────
export interface DashboardSummary {
  totalRevenue: number;
  totalBookings: number;
  totalCustomers: number;
}

// ─── API-16-02: Revenue Chart ─────────────────────────────────────────────────
export interface ChartDataPoint {
  label: string; // BE trả về sẵn, FE không format lại
  value: number;
}

export interface DashboardRevenueChart {
  revenueTotal: number;
  chartData: ChartDataPoint[];
}

// ─── API-16-03: Tables ────────────────────────────────────────────────────────
export interface PackageStat {
  packageName: string;
  bookingCount: number;
  percentage: number;
}

export type TierType = "MEMBER" | "SILVER" | "GOLD" | "PLATINUM";

export interface TierStat {
  tier: TierType;
  customerCount: number;
}

export interface DashboardTables {
  packageStats: PackageStat[];
  tierStats: TierStat[];
}

// ─── Filter dropdown: Province / Station (dùng cho ADMIN) ────────────────────
export interface ProvinceOption {
  provinceId: number;
  provinceName: string;
}

export interface StationOption {
  stationId: number;
  stationName: string;
  provinceId: number;
}

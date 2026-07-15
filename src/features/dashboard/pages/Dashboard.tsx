import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../hooks/useAuth";
import type {
  DashboardTab,
  GroupBy,
  DashboardSummary,
  DashboardRevenueChart,
  DashboardTables,
  ProvinceOption,
  StationOption,
} from "../types/dashboard";
import {
  getDashboardSummary,
  getDashboardRevenueChart,
  getDashboardTables,
  getProvinces,
  getStationsByProvince,
} from "../api/dashboardApi";
import DashboardFilter from "../components/DashboardFilter";
import SummaryCards from "../components/SummaryCard";
import RevenueChart from "../components/RevenueChart";
import DashboardTablesSection from "../components/DashboardTable";

// ─── Helper: tính fromDate / toDate / groupBy từ tab active ──────────────────
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTabParams(tab: DashboardTab): {
  fromDate: string;
  toDate: string;
  groupBy: GroupBy;
} {
  const now = new Date();

  switch (tab) {
    case "today": {
      const today = fmtDate(now);
      return { fromDate: today, toDate: today, groupBy: "HOUR" };
    }
    case "month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        fromDate: fmtDate(first),
        toDate: fmtDate(last),
        groupBy: "DAY",
      };
    }
    case "quarter":
      return {
        fromDate: `${now.getFullYear()}-01-01`,
        toDate: `${now.getFullYear()}-12-31`,
        groupBy: "QUARTER",
      };
    case "year":
    default:
      return {
        fromDate: `${now.getFullYear()}-01-01`,
        toDate: `${now.getFullYear()}-12-31`,
        groupBy: "MONTH",
      };
  }
}

// ─── Shape filter state ───────────────────────────────────────────────────────
interface FilterState {
  activeTab: DashboardTab;
  fromDate: string;
  toDate: string;
  provinceId?: number;
  stationId?: number;
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const role = (user?.role as "ADMIN" | "STAFF") ?? "ADMIN";

  // Khởi tạo với tab Year (default theo spec)
  const initTabParams = getTabParams("year");
  const initFilter: FilterState = {
    activeTab: "year",
    fromDate: initTabParams.fromDate,
    toDate: initTabParams.toDate,
  };

  // filter: state đang chỉnh trên UI
  const [filter, setFilter] = useState<FilterState>(initFilter);
  // appliedFilter: params đang dùng để fetch — thay đổi → trigger useEffect
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(initFilter);

  // Dữ liệu 3 API
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenueChart, setRevenueChart] =
    useState<DashboardRevenueChart | null>(null);
  const [tables, setTables] = useState<DashboardTables | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown data cho Admin
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);

  // Tránh setState sau khi unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load province list khi là ADMIN
  useEffect(() => {
    if (role !== "ADMIN") return;
    getProvinces().then((data) => {
      if (isMountedRef.current) setProvinces(data);
    });
  }, [role]);

  // Load stations khi chọn province
  useEffect(() => {
    if (role !== "ADMIN" || !appliedFilter.provinceId) {
      setStations([]);
      return;
    }
    getStationsByProvince(appliedFilter.provinceId).then((data) => {
      if (isMountedRef.current) setStations(data);
    });
  }, [role, appliedFilter.provinceId]);

  // Fetch cả 3 API khi appliedFilter thay đổi
  useEffect(() => {
    const { activeTab, fromDate, toDate, provinceId, stationId } =
      appliedFilter;
    const { groupBy } = getTabParams(activeTab);

    if (fromDate > toDate) return; // validate trước khi gọi API

    // Staff không gửi location params — BE tự lấy stationId từ JWT
    const locationParams = role === "ADMIN" ? { provinceId, stationId } : {};

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getDashboardSummary({ fromDate, toDate, ...locationParams }),
      getDashboardRevenueChart({
        fromDate,
        toDate,
        groupBy,
        ...locationParams,
      }),
      getDashboardTables({ fromDate, toDate, ...locationParams }),
    ])
      .then(([sum, chart, tabs]) => {
        if (cancelled) return;
        setSummary(sum);
        setRevenueChart(chart);
        setTables(tabs);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to load dashboard data. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appliedFilter, role]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Đổi tab → apply luôn, không cần bấm refresh
  function handleTabChange(tab: DashboardTab) {
    const tabParams = getTabParams(tab);
    const newFilter: FilterState = {
      activeTab: tab,
      fromDate: tabParams.fromDate,
      toDate: tabParams.toDate,
      provinceId: filter.provinceId,
      stationId: filter.stationId,
    };
    setFilter(newFilter);
    setAppliedFilter(newFilter);
  }

  // Date/station thay đổi → chỉ update UI, chờ bấm Apply
  const handleFromDateChange = (fromDate: string) =>
    setFilter((prev) => ({ ...prev, fromDate }));

  const handleToDateChange = (toDate: string) =>
    setFilter((prev) => ({ ...prev, toDate }));

  // Đổi province → reset stationId
  const handleProvinceChange = (provinceId?: number) =>
    setFilter((prev) => ({ ...prev, provinceId, stationId: undefined }));

  const handleStationChange = (stationId?: number) =>
    setFilter((prev) => ({ ...prev, stationId }));

  // Bấm nút refresh → apply filter hiện tại
  const handleApply = () => setAppliedFilter({ ...filter });

  // Validate date — hiển thị lỗi inline, block gọi API
  const dateError =
    filter.fromDate && filter.toDate && filter.fromDate > filter.toDate
      ? "Start date must be before or equal to end date"
      : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
          Performance Analytics
        </h1>
        <p className="text-sm text-outline">
          Business performance overview by time period
        </p>
      </div>

      {/* Filter bar */}
      <DashboardFilter
        role={role}
        activeTab={filter.activeTab}
        fromDate={filter.fromDate}
        toDate={filter.toDate}
        provinceId={filter.provinceId}
        stationId={filter.stationId}
        provinces={provinces}
        stations={stations}
        dateError={dateError}
        isLoading={isLoading}
        onTabChange={handleTabChange}
        onFromDateChange={handleFromDateChange}
        onToDateChange={handleToDateChange}
        onProvinceChange={handleProvinceChange}
        onStationChange={handleStationChange}
        onApply={handleApply}
      />

      {/* Global error */}
      {error && (
        <div className="rounded-lg border border-error-container bg-error-container/20 px-4 py-3 text-sm font-medium text-error">
          {error}
        </div>
      )}

      {/* 3 Summary cards */}
      <SummaryCards summary={summary} isLoading={isLoading} />

      {/* Revenue Chart */}
      <RevenueChart data={revenueChart} isLoading={isLoading} />

      {/* 2 bảng: Service Packages + Tier Distribution */}
      <DashboardTablesSection tables={tables} isLoading={isLoading} />
    </div>
  );
}

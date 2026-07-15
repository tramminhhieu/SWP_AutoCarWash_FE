import { Calendar, RefreshCw } from "lucide-react";
import type {
  DashboardTab,
  ProvinceOption,
  StationOption,
} from "../types/dashboard";

interface Props {
  role: "ADMIN" | "STAFF";
  activeTab: DashboardTab;
  fromDate: string;
  toDate: string;
  provinceId?: number;
  stationId?: number;
  provinces: ProvinceOption[];
  stations: StationOption[];
  dateError: string | null;
  isLoading: boolean;
  onTabChange: (tab: DashboardTab) => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onProvinceChange: (id?: number) => void;
  onStationChange: (id?: number) => void;
  onApply: () => void;
}

// Label hiển thị cho từng tab
const TAB_LABELS: { key: DashboardTab; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
];

export default function DashboardFilter({
  role,
  activeTab,
  fromDate,
  toDate,
  provinceId,
  stationId,
  provinces,
  stations,
  dateError,
  isLoading,
  onTabChange,
  onFromDateChange,
  onToDateChange,
  onProvinceChange,
  onStationChange,
  onApply,
}: Props) {
  // Tìm tên province đang chọn (dùng cho label "All branches in X")
  const selectedProvince = provinces.find((p) => p.provinceId === provinceId);

  return (
    <div className="flex flex-col gap-3">
      {/* ─── Hàng 1: Tab shortcuts + Date range + Apply button ────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tab group */}
        <div className="flex items-center rounded-lg border border-outline-variant/40 bg-white p-1 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-primary-container text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date range: FROM → TO */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-white px-3 py-2 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <Calendar className="size-4 shrink-0 text-outline" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="border-none bg-transparent text-sm font-medium text-on-surface outline-none"
            />
          </div>
          <span className="text-sm text-outline">—</span>
          <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-white px-3 py-2 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <Calendar className="size-4 shrink-0 text-outline" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="border-none bg-transparent text-sm font-medium text-on-surface outline-none"
            />
          </div>
        </div>

        {/* Apply/Refresh button */}
        <button
          onClick={onApply}
          disabled={!!dateError || isLoading}
          title="Apply filter"
          className="flex size-9 items-center justify-center rounded-full bg-primary-container text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ─── Date validation error (inline) ──────────────────────────────── */}
      {dateError && (
        <p className="text-xs font-medium text-error">{dateError}</p>
      )}

      {/* ─── Hàng 2: Station dropdown 2 tầng (chỉ ADMIN) ─────────────────── */}
      {role === "ADMIN" && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Tầng 1: chọn Province */}
          <select
            value={provinceId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              onProvinceChange(val ? Number(val) : undefined);
            }}
            className="rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm text-on-surface shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] outline-none focus:border-primary-container"
          >
            <option value="">All branches</option>
            {provinces.map((p) => (
              <option key={p.provinceId} value={p.provinceId}>
                {p.provinceName}
              </option>
            ))}
          </select>

          {/* Tầng 2: chọn Station (chỉ hiện khi đã chọn province) */}
          {provinceId !== undefined && (
            <select
              value={stationId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onStationChange(val ? Number(val) : undefined);
              }}
              className="rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm text-on-surface shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] outline-none focus:border-primary-container"
            >
              <option value="">
                All branches in {selectedProvince?.provinceName}
              </option>
              {stations.map((s) => (
                <option key={s.stationId} value={s.stationId}>
                  {s.stationName}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

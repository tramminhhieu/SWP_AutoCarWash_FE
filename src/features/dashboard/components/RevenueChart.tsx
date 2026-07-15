import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DashboardRevenueChart } from "../types/dashboard";
import { formatCurrency } from "../../../utils/format";

interface Props {
  data: DashboardRevenueChart | null;
  isLoading: boolean;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-outline-variant/30 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-outline">{label}</p>
      <p className="text-sm font-bold text-primary-container">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

// Format trục Y: rút gọn số lớn thành "10K", "30K", "1M"
function formatYAxis(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

// Skeleton chart
function ChartSkeleton() {
  return (
    <div className="h-64 w-full animate-pulse rounded-xl bg-surface-container-low" />
  );
}

export default function RevenueChart({ data, isLoading }: Props) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
      {/* Header: label + tổng doanh thu */}
      <div className="mb-5 flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
          Revenue Overview
        </span>
        {isLoading || !data ? (
          <div className="h-9 w-48 animate-pulse rounded bg-surface-container-high" />
        ) : (
          <p className="font-heading text-3xl font-bold tracking-tight text-primary-container">
            {formatCurrency(data.revenueTotal)}
          </p>
        )}
      </div>

      {/* Chart area */}
      {isLoading ? (
        <ChartSkeleton />
      ) : !data || data.chartData.length === 0 ? (
        // Empty state
        <div className="flex h-64 items-center justify-center text-sm text-outline">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data.chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="30%"
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#747686", fontFamily: "Inter" }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#747686", fontFamily: "Inter" }}
              width={40}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(29,78,216,0.04)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.chartData.map((entry, index) => (
                // Bar có value = 0 → màu nhạt, còn lại → Ocean Blue
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value === 0 ? "#dce2f7" : "#1D4ED8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

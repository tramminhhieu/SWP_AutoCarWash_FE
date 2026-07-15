import { DollarSign, Users, CalendarCheck } from "lucide-react";
import type { DashboardSummary } from "../types/dashboard";
import { formatCurrency } from "../../../utils/format";

interface Props {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

// Config từng card — icon, label, cách lấy value và format
const CARD_CONFIG = [
  {
    key: "revenue" as const,
    label: "Total Revenue",
    icon: DollarSign,
    iconBg: "bg-primary-container/10",
    iconColor: "text-primary-container",
    getValue: (s: DashboardSummary) => formatCurrency(s.totalRevenue),
  },
  {
    key: "bookings" as const,
    label: "Total Bookings",
    icon: CalendarCheck,
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    getValue: (s: DashboardSummary) => s.totalBookings.toLocaleString("en-US"),
  },
  {
    key: "customers" as const,
    label: "Total Customers",
    icon: Users,
    iconBg: "bg-tertiary-container/20",
    iconColor: "text-tertiary-container",
    getValue: (s: DashboardSummary) => s.totalCustomers.toLocaleString("en-US"),
  },
];

// Skeleton 1 card
function CardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
      <div className="flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
      </div>
      <div className="h-9 w-40 animate-pulse rounded bg-surface-container-high" />
    </div>
  );
}

export default function SummaryCard({ summary, isLoading }: Props) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARD_CONFIG.map((c) => (
          <CardSkeleton key={c.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {CARD_CONFIG.map(
        ({ key, label, icon: Icon, iconBg, iconColor, getValue }) => (
          <div
            key={key}
            className="flex flex-1 flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-shadow hover:shadow-[0_10px_30px_-5px_rgba(29,78,216,0.1)]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${iconBg}`}
              >
                <Icon className={`size-5 ${iconColor}`} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[1px] text-outline">
                {label}
              </span>
            </div>
            <p className="font-heading text-3xl font-bold tracking-tight text-on-surface">
              {getValue(summary)}
            </p>
          </div>
        ),
      )}
    </div>
  );
}

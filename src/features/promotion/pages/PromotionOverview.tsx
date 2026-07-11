import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tag, Plus, Building2, TrendingUp } from "lucide-react";
import { getBranchPromotionSummary } from "../api/promotionApi";
import type { BranchPromotionSummary } from "../types/promotion";
import type { PromotionStatus } from "../types/enums";
import Modal from "../../../components/ui/Modal";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: PromotionStatus }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Expired", value: "EXPIRED" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  title,
  value,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
      <div
        className={`flex size-10 items-center justify-center rounded-md ${accent}`}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
          {title}
        </span>
        <span className="font-heading text-3xl font-bold text-on-surface">
          {value}
        </span>
      </div>
    </div>
  );
}

// Skeleton card khi đang load
function StationCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-outline-variant/20 bg-white p-6">
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container-high" />
      <div className="h-8 w-1/3 animate-pulse rounded bg-surface-container-high" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-surface-container-high" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionOverview() {
  const navigate = useNavigate();
  const location = useLocation();

  const [statusFilter, setStatusFilter] = useState<PromotionStatus>("ACTIVE");
  const [summary, setSummary] = useState<BranchPromotionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(
    () =>
      (location.state as { successMessage?: string })?.successMessage ?? null,
  );

  useEffect(() => {
    if (!toast) return;
    window.history.replaceState({}, "");
    const timer = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    getBranchPromotionSummary({ status: statusFilter })
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch(() => {
        if (isMounted)
          setError("Unable to load branch summary. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  // Đổi status → reset state rồi mới đổi filter để trigger effect
  function handleStatusChange(val: PromotionStatus) {
    if (val === statusFilter) return;
    setIsLoading(true);
    setError(null);
    setStatusFilter(val);
  }

  // Tổng số promotion toàn hệ thống
  const totalPromotions = summary.reduce(
    (sum, s) => sum + s.totalActivePromotions,
    0,
  );
  // Số chi nhánh đang có ít nhất 1 promotion
  const activeBranchCount = summary.filter(
    (s) => s.totalActivePromotions > 0,
  ).length;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <Modal
        isOpen={!!toast}
        onClose={() => setToast(null)}
        variant="success"
        title="Success"
        message={toast}
      />

      {/* ── Header ── */}

      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Promotion Overview
          </h1>
          <p className="text-sm text-on-surface-variant">
            System-wide promotion summary. Click a branch to view details.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/promotions/create")}
          className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.15)] transition-opacity hover:opacity-90"
        >
          <Plus size={16} strokeWidth={2.5} className="text-white" />
          <span className="text-sm font-bold tracking-[0.14px] text-white">
            New Promotion
          </span>
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="flex gap-6">
        <SummaryCard
          icon={<Tag className="size-5 text-primary" />}
          title={`${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Promotions`}
          value={isLoading ? "—" : totalPromotions}
          accent="bg-primary/10"
        />
        <SummaryCard
          icon={<Building2 className="size-5 text-secondary" />}
          title="Branches with Promotions"
          value={isLoading ? "—" : activeBranchCount}
          accent="bg-secondary/10"
        />
        <SummaryCard
          icon={<TrendingUp className="size-5 text-tertiary" />}
          title="Total Branches"
          value={isLoading ? "—" : summary.length}
          accent="bg-tertiary-container/20"
        />
      </div>

      {/* ── Status Filter ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-on-surface-variant">
          Status:
        </span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-white shadow-[0px_4px_12px_rgba(29,78,216,0.2)]"
                : "border border-outline-variant/40 bg-white text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Branch Grid ── */}
      <div className="rounded-[16px] border border-outline-variant/30 bg-white shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-on-surface">
            Branch Distribution
          </h2>
          {!isLoading && (
            <span className="text-xs font-medium text-outline">
              {summary.length} branches
            </span>
          )}
        </div>

        {error ? (
          <div className="flex h-48 items-center justify-center text-sm text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <StationCardSkeleton key={i} />
            ))}
          </div>
        ) : summary.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-outline">
            No branches found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4">
            {summary.map((s) => (
              <button
                key={s.stationId}
                onClick={() =>
                  // Navigate sang trang Detail, truyền stationId + stationName qua state
                  navigate(`/admin/promotions/station/${s.stationId}`, {
                    state: {
                      stationName: s.stationName,
                      defaultStatus: statusFilter,
                    },
                  })
                }
                className="group flex flex-col gap-2 rounded-[16px] border border-outline-variant/20 bg-white p-6 text-left transition-all hover:border-primary/30 hover:shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.1)]"
              >
                <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary">
                  {s.stationName}
                </span>
                <span className="font-heading text-3xl font-bold text-primary">
                  {s.totalActivePromotions}
                </span>
                <div className="flex items-center gap-1 text-xs text-outline">
                  <span>promotions</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

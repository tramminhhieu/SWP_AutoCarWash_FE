import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTierStyle } from "../../../constants/tierStyles";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Tag,
  Ticket,
  ChevronDown,
} from "lucide-react";
import { getAdminPromotions } from "../api/promotionApi";
import type {
  PromotionItem,
  PromotionStatus,
  PromotionStation,
  PromotionTarget,
} from "../types/promotion";
import BranchFilterDropdown, {
  type BranchFilterSelection,
} from "../../station/components/BranchFilterDropdown";
import { formatCheckInTime } from "../../booking/utils/bookingFormatters";
import Modal from "../../../components/ui/Modal";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

const STATUS_OPTIONS: { value: PromotionStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "EXPIRED", label: "Expired" },
];

const STATUS_BADGE: Record<
  PromotionStatus,
  { bg: string; text: string; border: string }
> = {
  ACTIVE: {
    bg: "bg-tertiary-container/10",
    text: "text-tertiary-container",
    border: "border-tertiary-container/30",
  },
  UPCOMING: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    border: "border-secondary/30",
  },
  EXPIRED: {
    bg: "bg-surface-container-high",
    text: "text-outline",
    border: "border-outline/20",
  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusPill({ status }: { status: PromotionStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-[0.6px] ${s.bg} ${s.text} ${s.border}`}
    >
      {status}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="font-heading text-2xl font-semibold text-on-surface">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionOverview() {
  const navigate = useNavigate();
  const location = useLocation();

  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ??
      null,
  );

  // Xóa message khỏi history state sau khi đã hiển thị, tránh F5 hiện lại
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự ẩn popup thành công sau 1.5s
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 1500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Search + status: filter client-side trên state
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | "">("");

  // Branch filter: gọi lại API khi đổi
  const [branchFilter, setBranchFilter] = useState<BranchFilterSelection>(null);

  const [page, setPage] = useState(1);

  // Gọi API khi mount hoặc khi đổi branch filter
  useEffect(() => {
    let isMounted = true;

    const params = {
      provinceId:
        branchFilter?.level === "province" ? branchFilter.id : undefined,
      stationId:
        branchFilter?.level === "station" ? branchFilter.id : undefined,
    };

    getAdminPromotions(params)
      .then((data: PromotionItem[]) => {
        if (isMounted) setPromotions(data);
      })
      .catch(() => {
        if (isMounted) setError("Unable to load promotions. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchFilter]);

  function handleSearchSubmit() {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  }

  function handleFilterChange(update: () => void) {
    update();
    setPage(1);
  }

  // Filter client-side theo title và status — không gọi lại API
  const filtered = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        !appliedSearch ||
        p.title.toLowerCase().includes(appliedSearch.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [promotions, appliedSearch, statusFilter]);

  // KPI đếm từ toàn bộ data — không bị ảnh hưởng bởi search/status filter
  const totalPromotions = promotions.length;
  const totalVouchers = promotions.reduce(
    (sum, p) => sum + (p.vouchers?.length ?? 0),
    0,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedRows = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* Thông báo thành công (create/update) */}
      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        variant="success"
        title="Success"
        message={successMessage}
      />
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Promotions
          </h1>
          <p className="text-sm text-on-surface-variant">
            Manage all campaigns and vouchers across the system.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/promotions/create")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          New Promotion
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="flex flex-wrap gap-4">
        <KpiCard
          icon={Tag}
          label="Total Promotions"
          value={totalPromotions.toLocaleString()}
        />
        <KpiCard
          icon={Ticket}
          label="Total Vouchers"
          value={totalVouchers.toLocaleString()}
        />
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearchSubmit();
          }}
          placeholder="Search by campaign name"
          className="w-72 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        />
        <button
          type="button"
          onClick={handleSearchSubmit}
          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface"
        >
          <Search className="size-4" />
          Search
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter — client-side */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              handleFilterChange(() =>
                setStatusFilter(e.target.value as PromotionStatus | ""),
              )
            }
            className="appearance-none rounded-lg border border-outline-variant bg-white py-2 pl-3 pr-9 text-sm font-medium text-on-surface"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        </div>

        {/* Branch filter — gọi lại API khi đổi */}
        <BranchFilterDropdown
          onChange={(sel: BranchFilterSelection) =>
            handleFilterChange(() => {
              setBranchFilter(sel);
              setIsLoading(true);
              setError(null);
            })
          }
        />
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {error ? (
          <div className="flex h-48 items-center justify-center text-base text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            No promotions found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {[
                    "ID",
                    "Campaign Name",
                    "Voucher",
                    "Stations",
                    "Target Segments",
                    "Status",
                    "Start Date",
                    "End Date",
                    "Created Date",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() =>
                      navigate(`/admin/promotions/${row.id}`, {
                        state: { promotion: row },
                      })
                    }
                    className={`cursor-pointer hover:bg-surface-container-low ${
                      i > 0 ? "border-t border-outline-variant" : ""
                    }`}
                  >
                    {/* ID */}
                    <td className="px-6 py-5 text-base font-medium text-on-surface">
                      #{row.id}
                    </td>

                    {/* Campaign Name */}
                    <td className="px-6 py-5 text-base text-on-surface">
                      {row.title}
                    </td>

                    {/* Voucher */}
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {(row.vouchers ?? []).length > 0 ? (
                          <>
                            {(row.vouchers ?? []).slice(0, 2).map((v) => (
                              <span
                                key={v.id}
                                className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary"
                              >
                                {v.voucherCode}
                              </span>
                            ))}
                            {(row.vouchers ?? []).length > 2 && (
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                +{(row.vouchers ?? []).length - 2} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-outline">—</span>
                        )}
                      </div>
                    </td>

                    {/* Stations — hiện tối đa 2, dư thì +N more; rỗng = all branches */}
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {(row.stations ?? []).length > 0 &&
                        (row.stations ?? []).length < 7 ? (
                          <>
                            {(row.stations ?? [])
                              .slice(0, 2)
                              .map((s: PromotionStation) => (
                                <span
                                  key={s.stationId}
                                  className="rounded-md bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface-variant"
                                >
                                  {s.stationName}
                                </span>
                              ))}
                            {(row.stations ?? []).length > 2 && (
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                +{(row.stations ?? []).length - 2} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                            All Stations
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Target Segments — hiện targetCode với màu tier; rỗng = all customers */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1">
                        {(row.targets ?? []).length > 0 &&
                        (row.targets ?? []).length < 4 ? (
                          (row.targets ?? []).map((t: PromotionTarget) => {
                            const style = getTierStyle(t.targetCode);
                            return (
                              <span
                                key={t.targetId}
                                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${style.badge}`}
                              >
                                {t.targetCode}
                              </span>
                            );
                          })
                        ) : (
                          <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                            All Customers
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <StatusPill status={row.status} />
                    </td>

                    {/* Start Date */}
                    <td className="px-6 py-5 text-base text-on-surface">
                      {row.startDate}
                    </td>

                    {/* End Date */}
                    <td className="px-6 py-5 text-base text-on-surface">
                      {row.endDate}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-5 text-base text-on-surface">
                      {formatCheckInTime(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination — client-side */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-primary text-white"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

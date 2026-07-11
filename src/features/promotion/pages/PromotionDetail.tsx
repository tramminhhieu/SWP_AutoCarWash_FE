import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
  getPromotionDashboardList,
  softDeleteCampaign,
  softDeleteVoucher,
} from "../api/promotionApi";
import type {
  PromotionDashboardItem,
  PromotionEditNavState,
} from "../types/promotion";
import type { PromotionStatus, PromotionType } from "../types/enums";
import Modal from "../../../components/ui/Modal";
import BackButton from "../../../components/ui/BackButton";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { label: string; value: PromotionStatus }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Expired", value: "EXPIRED" },
];

// Badge theo loại chương trình
const TYPE_BADGE: Record<
  PromotionType,
  { bg: string; text: string; label: string }
> = {
  CAMPAIGN: {
    bg: "bg-primary/10",
    text: "text-primary",
    label: "Campaign",
  },
  STANDALONE_VOUCHER: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    label: "Standalone Voucher",
  },
};

// Badge theo trạng thái
const STATUS_BADGE: Record<
  PromotionStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  ACTIVE: {
    bg: "bg-tertiary-container/20",
    text: "text-tertiary",
    dot: "bg-tertiary",
    label: "Active",
  },
  UPCOMING: {
    bg: "bg-secondary-container/20",
    text: "text-secondary",
    dot: "bg-secondary",
    label: "Upcoming",
  },
  EXPIRED: {
    bg: "bg-surface-container-high",
    text: "text-outline",
    dot: "bg-outline",
    label: "Expired",
  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PromotionType }) {
  const s = TYPE_BADGE[type];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

function StatusBadge({ status }: { status: PromotionStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${s.bg}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      <span
        className={`text-xs font-bold uppercase tracking-[0.6px] ${s.text}`}
      >
        {s.label}
      </span>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-outline-variant/20">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 animate-pulse rounded bg-surface-container-high" />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionDetail() {
  const navigate = useNavigate();
  const { stationId } = useParams<{ stationId: string }>();
  const stationIdNum = Number(stationId);

  // Nhận stationName và defaultStatus từ navigation state (truyền từ OverviewPage)
  const location = useLocation();
  const locationState = location.state as {
    stationName?: string;
    defaultStatus?: PromotionStatus;
  } | null;

  const stationName = locationState?.stationName ?? `Station #${stationId}`;
  const [statusFilter, setStatusFilter] = useState<PromotionStatus>(
    locationState?.defaultStatus ?? "ACTIVE",
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [items, setItems] = useState<PromotionDashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(
    () =>
      (locationState as { successMessage?: string })?.successMessage ?? null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<PromotionDashboardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    window.history.replaceState({}, "");
    const timer = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    // Guard: stationId phải là số hợp lệ
    if (!stationId || isNaN(Number(stationId))) return;

    let isMounted = true;

    getPromotionDashboardList({
      stationId: Number(stationId),
      status: statusFilter,
      page: currentPage,
      size: PAGE_SIZE,
    })
      .then((data) => {
        if (isMounted) setItems(data);
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
  }, [stationId, statusFilter, currentPage]);

  function handleStatusChange(val: PromotionStatus) {
    if (val === statusFilter) return;
    setIsLoading(true);
    setError(null);
    setCurrentPage(0);
    setStatusFilter(val);
  }

  function handlePageChange(newPage: number) {
    setIsLoading(true);
    setCurrentPage(newPage);
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.type === "CAMPAIGN") {
        await softDeleteCampaign(deleteTarget.id);
      } else {
        await softDeleteVoucher(deleteTarget.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <Modal
        isOpen={!!toast}
        onClose={() => setToast(null)}
        variant="success"
        title="Success"
        message={toast}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        variant="danger"
        title="Delete this promotion?"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-on-surface">{deleteTarget?.name}</strong>?
            This action cannot be undone.
          </>
        }
        onConfirm={confirmDelete}
        isConfirmLoading={isDeleting}
      />

      <Modal
        isOpen={!!deleteError}
        onClose={() => setDeleteError(null)}
        variant="danger"
        title="Unable to Delete"
        message={deleteError ?? ""}
        confirmText="Got it"
        onConfirm={() => setDeleteError(null)}
      />

      {/* ── Header ── */}
      <div className="flex flex-col items-start gap-4">
        <BackButton />
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            {stationName}
          </h1>
          <p className="text-sm text-on-surface-variant">
            Promotions and vouchers active at this branch.
          </p>
        </div>
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

      {/* ── Promotion Table ── */}
      <div className="rounded-[16px] border border-outline-variant/30 bg-white shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-on-surface">
            All Promotions
          </h2>
          {!isLoading && !error && (
            <span className="text-xs font-medium text-outline">
              {items.length} result{items.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/40">
                {[
                  "Type",
                  "Name",
                  "Applied Branches",
                  "Target Segments",
                  "Period",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[1.2px] text-outline"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-error"
                  >
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-outline"
                  >
                    No promotions found for the selected status.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low/30"
                  >
                    <td className="px-4 py-4">
                      <TypeBadge type={item.type} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-on-surface">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.appliedStations.map((s) => (
                          <span
                            key={s}
                            className="rounded-md bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface-variant"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.targetSegments.map((seg) => (
                          <span
                            key={seg}
                            className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {seg}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-on-surface">
                          {item.startDate}
                        </span>
                        <span className="text-xs text-outline">
                          → {item.endDate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {/* CAMPAIGN → edit promotion metadata (API-03-01) */}
                        {/* STANDALONE_VOUCHER → edit voucher financial rules (API-03-02) */}
                        <button
                          onClick={() => {
                            const editState: PromotionEditNavState = {
                              configMode: item.configMode,
                              promotionId:
                                item.type === "CAMPAIGN" ? item.id : null,
                              voucherId:
                                item.type === "STANDALONE_VOUCHER"
                                  ? item.id
                                  : item.voucherId,
                              voucherCode: item.voucherCode,
                              stationName,
                              stationId: stationIdNum,
                              currentName: item.name,
                              currentStartDate: item.startDate,
                              currentEndDate: item.endDate,
                            };
                            navigate(
                              `/admin/promotions/${item.type === "CAMPAIGN" ? item.id : (item.voucherId ?? item.id)}/edit`,
                              {
                                state: editState,
                              },
                            );
                          }}
                          className="flex items-center gap-1.5 rounded-md border border-outline-variant/30 px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="flex items-center gap-1.5 rounded-md border border-error/20 px-2.5 py-1.5 text-xs font-semibold text-error/70 transition-colors hover:border-error hover:text-error"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — chỉ hiện khi có data */}
        {!isLoading && !error && items.length > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant/20 px-6 py-4">
            <span className="text-xs text-outline">Page {currentPage + 1}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="flex size-8 items-center justify-center rounded-[8px] border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[32px] text-center text-sm font-semibold text-on-surface">
                {currentPage + 1}
              </span>
              {/* Disable Next nếu ít hơn PAGE_SIZE item — BE chưa trả totalPages */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={items.length < PAGE_SIZE}
                className="flex size-8 items-center justify-center rounded-[8px] border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

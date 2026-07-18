import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Building2,
  Users,
  CalendarDays,
} from "lucide-react";
import {
  getPromotionById,
  softDeleteCampaign,
  softDeleteVoucher,
} from "../api/promotionApi";
import type {
  PromotionItem,
  PromotionVoucher,
  PromotionStatus,
} from "../types/promotion";
import Modal from "../../../components/ui/Modal";
import { formatCurrency } from "../../../utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isInvalidId = !id || isNaN(Number(id));

  // ── State ──
  const [promotion, setPromotion] = useState<PromotionItem | null>(null);
  const [vouchers, setVouchers] = useState<PromotionVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(1);

  // Delete campaign
  const [showDeleteCampaign, setShowDeleteCampaign] = useState(false);
  const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);
  const [deleteCampaignError, setDeleteCampaignError] = useState<string | null>(
    null,
  );

  // Delete voucher
  const [deleteVoucherTarget, setDeleteVoucherTarget] =
    useState<PromotionVoucher | null>(null);
  const [isDeletingVoucher, setIsDeletingVoucher] = useState(false);
  const [deleteVoucherError, setDeleteVoucherError] = useState<string | null>(
    null,
  );

  // Load promotion theo id từ URL
  useEffect(() => {
    if (isInvalidId) return;

    let isMounted = true;

    getPromotionById(Number(id))
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setNotFound(true);
        } else {
          setPromotion(data);
          setVouchers(data.vouchers);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isInvalidId]);

  async function confirmDeleteCampaign() {
    if (!promotion) return;
    setIsDeletingCampaign(true);
    setDeleteCampaignError(null);
    try {
      await softDeleteCampaign(promotion.id);
      navigate("/admin/promotions");
    } catch {
      setDeleteCampaignError("Failed to delete promotion. Please try again.");
    } finally {
      setIsDeletingCampaign(false);
    }
  }

  async function confirmDeleteVoucher() {
    if (!deleteVoucherTarget) return;
    setIsDeletingVoucher(true);
    setDeleteVoucherError(null);
    try {
      await softDeleteVoucher(deleteVoucherTarget.id);
      setVouchers((prev) =>
        prev.filter((v) => v.id !== deleteVoucherTarget.id),
      );
      setDeleteVoucherTarget(null);
    } catch {
      setDeleteVoucherError("Failed to delete voucher. Please try again.");
    } finally {
      setIsDeletingVoucher(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(vouchers.length / PAGE_SIZE));
  const paginatedVouchers = vouchers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // ── Invalid ID ──
  if (isInvalidId) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-base text-outline">Promotion not found.</p>
        <button
          onClick={() => navigate("/admin/promotions")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back to Promotions
        </button>
      </div>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-base text-outline">
        Loading...
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !promotion) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-base text-outline">Promotion not found.</p>
        <button
          onClick={() => navigate("/admin/promotions")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back to Promotions
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* ── Modals ── */}
      <Modal
        isOpen={showDeleteCampaign}
        onClose={() => setShowDeleteCampaign(false)}
        variant="danger"
        title="Delete this promotion?"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-on-surface">{promotion.title}</strong>? All
            associated vouchers will also be deactivated. This action cannot be
            undone.
          </>
        }
        onConfirm={confirmDeleteCampaign}
        isConfirmLoading={isDeletingCampaign}
      />

      <Modal
        isOpen={!!deleteCampaignError}
        onClose={() => setDeleteCampaignError(null)}
        variant="danger"
        title="Unable to Delete"
        message={deleteCampaignError ?? ""}
        confirmText="Got it"
        onConfirm={() => setDeleteCampaignError(null)}
      />

      <Modal
        isOpen={!!deleteVoucherTarget}
        onClose={() => setDeleteVoucherTarget(null)}
        variant="danger"
        title="Delete this voucher?"
        message={
          <>
            Are you sure you want to delete voucher{" "}
            <strong className="text-on-surface">
              {deleteVoucherTarget?.voucherCode}
            </strong>
            ? This action cannot be undone.
          </>
        }
        onConfirm={confirmDeleteVoucher}
        isConfirmLoading={isDeletingVoucher}
      />

      <Modal
        isOpen={!!deleteVoucherError}
        onClose={() => setDeleteVoucherError(null)}
        variant="danger"
        title="Unable to Delete"
        message={deleteVoucherError ?? ""}
        confirmText="Got it"
        onConfirm={() => setDeleteVoucherError(null)}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/admin/promotions")}
            className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to Promotions
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
              {promotion.title}
            </h1>
            <StatusPill status={promotion.status} />
          </div>
          {promotion.description && (
            <p className="text-sm text-on-surface-variant">
              {promotion.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/admin/promotions/${promotion.id}/edit`, {
                state: { promotion },
              })
            }
            className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <Pencil className="size-4" />
            Edit Campaign
          </button>
          <button
            onClick={() => setShowDeleteCampaign(true)}
            className="flex items-center gap-2 rounded-lg border border-error/20 bg-white px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/5"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-5">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Campaign Period
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {promotion.startDate} → {promotion.endDate}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Applied Branches
            </p>
            {promotion.stations.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {promotion.stations.map((s) => (
                  <span
                    key={s.stationId}
                    className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-on-surface-variant"
                  >
                    {s.stationName}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-outline">All branches</span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Target Segments
            </p>
            {promotion.targets.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {promotion.targets.map((t) => (
                  <span
                    key={t.targetId}
                    className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-secondary"
                  >
                    {t.targetName}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-outline">All customers</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Vouchers Table ── */}
      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <p className="font-heading text-base font-semibold text-on-surface">
            Vouchers
          </p>
          <span className="text-xs font-medium text-outline">
            {vouchers.length} voucher{vouchers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {vouchers.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-outline">
            No vouchers found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {[
                    "Voucher Code",
                    "Discount",
                    "Max Discount",
                    "Min Order",
                    "Usage",
                    "Reusable",
                    "Period",
                    "Status",
                    "Actions",
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
                {paginatedVouchers.map((v, i) => (
                  <tr
                    key={v.id}
                    className={`${i > 0 ? "border-t border-outline-variant" : ""} hover:bg-surface-container-low`}
                  >
                    {/* Voucher Code */}
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-bold text-on-surface">
                        {v.voucherCode}
                      </span>
                    </td>

                    {/* Discount */}
                    <td className="px-6 py-5 text-sm text-on-surface">
                      {v.discountPercentage}%
                    </td>

                    {/* Max Discount */}
                    <td className="px-6 py-5 text-sm text-on-surface">
                      {formatCurrency(v.maxDiscountAmount)}
                    </td>

                    {/* Min Order */}
                    <td className="px-6 py-5 text-sm text-on-surface">
                      {formatCurrency(v.minOrderValue)}
                    </td>

                    {/* Usage */}
                    <td className="px-6 py-5 text-sm">
                      <span className="font-semibold text-on-surface">
                        {v.usedCount}
                      </span>
                      <span className="text-outline"> / {v.usageLimit}</span>
                    </td>

                    {/* Reusable */}
                    <td className="px-6 py-5 text-sm">
                      {v.reusable ? (
                        <span className="font-semibold text-tertiary-container">
                          Yes
                        </span>
                      ) : (
                        <span className="text-outline">No</span>
                      )}
                    </td>

                    {/* Period */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="text-on-surface">
                          {v.startDate.split("T")[0]}
                        </span>
                        <span className="text-outline">
                          → {v.expiryDate.split("T")[0]}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <StatusPill status={v.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeleteVoucherTarget(v)}
                          className="flex items-center gap-1.5 rounded-md border border-error/20 px-2.5 py-1.5 text-xs font-semibold text-error/70 transition-colors hover:border-error hover:text-error"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
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

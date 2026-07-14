import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { formatCurrency } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getAll, remove } from "../api/subscriptionPlanApi";
import {
  getAll as getServicePackages,
  getAllAddonServices,
} from "../../servicepackage/api/servicePackageApi";
import type { SubscriptionPlan } from "../types/subscriptionPlan";
import type {
  AddonService,
  ServicePackage,
} from "../../servicepackage/types/servicePackage";

/* ================================================================
   Constants
   ================================================================ */
const TABS = ["1-Month", "3-Month", "6-Month"] as const;
type TabType = (typeof TABS)[number];

const TAB_DURATION: Record<TabType, number> = {
  "1-Month": 30,
  "3-Month": 90,
  "6-Month": 180,
};

// Thứ tự card hiển thị theo tier: Basic → Medium → Premium
const TIER_ORDER: Record<string, number> = { Basic: 0, Medium: 1, Premium: 2 };

// Badge trạng thái ACTIVE/INACTIVE — dùng cùng ngôn ngữ màu với subscriptionStyles.ts
const STATUS_BADGE: Record<SubscriptionPlan["status"], string> = {
  ACTIVE: "bg-tertiary/10 text-tertiary border-tertiary/30",
  INACTIVE:
    "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
};

/* ================================================================
   Sub-component: Skeleton card khi đang load
   ================================================================ */
function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-8">
      <div className="h-7 w-2/3 animate-pulse rounded bg-surface-container-high" />
      <div className="mt-3 h-6 w-1/2 animate-pulse rounded-full bg-surface-container-high" />
      <div className="mt-5 h-8 w-3/5 animate-pulse rounded bg-surface-container-high" />
      <div className="my-5 border-t border-outline-variant" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded-full bg-surface-container-high" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-11 animate-pulse rounded-lg bg-surface-container-high" />
    </div>
  );
}

/* ================================================================
   Sub-component: 1 card gói Unlimited (admin view)
   ================================================================ */
function PlanCard({
  plan,
  allAddons,
  includedAddonIds,
  isDeleting,
  onEdit,
  onDelete,
}: {
  plan: SubscriptionPlan;
  allAddons: AddonService[];
  // Set<addonId> của gói này, map từ servicePackageName → ServicePackage → addonIds
  includedAddonIds: Set<number>;
  isDeleting: boolean;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
}) {
  const pricePerMonth = Math.round(plan.price / (plan.durationDays / 30));

  return (
    <div className="flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-soft transition-shadow hover:shadow-[0_10px_25px_-5px_rgba(29,78,216,0.1)]">
      <div className="flex-1">
        {/* Tên gói + badge trạng thái */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-headline-md font-bold text-on-surface">
            {plan.planName}
          </h3>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-label-sm font-bold uppercase tracking-wider ${STATUS_BADGE[plan.status]}`}
          >
            {plan.status}
          </span>
        </div>

        {/* Mô tả ngắn */}
        {plan.description && (
          <span className="mt-2 inline-block self-start rounded-full bg-primary/10 px-3 py-1 text-label-sm font-medium text-primary">
            {plan.description}
          </span>
        )}

        {/* Giá/tháng + tổng giá */}
        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-heading text-headline-md font-bold text-primary">
            {formatCurrency(pricePerMonth)}
          </span>
          <span className="font-body text-body-md text-on-surface-variant">
            /month
          </span>
        </div>
        <p className="mt-1 font-body text-body-sm text-on-surface-variant">
          {formatCurrency(plan.price)} total for {plan.durationDays / 30}{" "}
          {plan.durationDays / 30 === 1 ? "month" : "months"}
        </p>

        <div className="my-5 border-t border-outline-variant" />

        {/* Chip thời hạn + tên service package */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
            <CalendarClock size={14} />
            {plan.durationDays} days
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
            {plan.servicePackageName}
          </span>
        </div>

        {/* Checklist addon ✓/✗ — hiện tên đầy đủ từ AddonService */}
        {allAddons.length > 0 && (
          <ul className="space-y-2.5">
            {allAddons.map((addon) => {
              const isIncluded = includedAddonIds.has(addon.id);
              return (
                <li key={addon.id} className="flex items-center gap-2.5">
                  {isIncluded ? (
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-tertiary-fixed-dim"
                      strokeWidth={2}
                    />
                  ) : (
                    <XCircle
                      size={16}
                      className="shrink-0 text-error"
                      strokeWidth={2}
                    />
                  )}
                  <span
                    className={`font-body text-body-sm ${
                      isIncluded ? "text-on-surface" : "text-on-surface-variant"
                    }`}
                  >
                    {addon.name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* CTA admin: Edit + Delete */}
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2.5 font-body text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Pencil size={14} />
          Edit
        </button>
        {/* Đã INACTIVE (soft-deleted) → disable nút Delete tránh call API 2 lần */}
        <button
          type="button"
          onClick={() => onDelete(plan)}
          disabled={plan.status === "INACTIVE" || isDeleting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-error/30 px-3 py-2.5 font-body text-sm font-medium text-error transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   Page chính: UnlimitedSubscriptionList (admin-only)
   ================================================================ */
export default function UnlimitedSubscriptionList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<TabType>("1-Month");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State popup xác nhận xóa (soft delete → INACTIVE)
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Thông báo thành công từ Create/Edit page truyền qua router state
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

  // Load lần đầu: fetch song song plans + service packages + addons
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    Promise.all([
      // Hardcode UNLIMIT - trang này chỉ quản lý gói Unlimited
      getAll("ALL", "UNLIMIT"),
      getServicePackages().catch(() => []),
      getAllAddonServices().catch(() => []),
    ])
      .then(([plansData, packagesData, addonsData]) => {
        if (!isMounted) return;
        setPlans(plansData);
        setServicePackages(packagesData as ServicePackage[]);
        setAddonServices(addonsData as AddonService[]);
      })
      .catch((err) => {
        if (!isMounted) return;
        const { message } = getApiErrorInfo(err);
        setError(message ?? "Failed to load subscription plans.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Reload chỉ plans sau khi xóa — packages/addons không đổi nên không cần fetch lại
  const reloadPlans = useCallback(() => {
    getAll("ALL", "UNLIMIT")
      .then((data) => setPlans(data))
      .catch((err) => {
        const { message } = getApiErrorInfo(err);
        setError(message ?? "Failed to retrieve subscription plans.");
      });
  }, []);

  // servicePackageName → Set<addonId> để tra ✓/✗ cho từng card
  const includedAddonIdsByPackageName = useMemo(
    () => new Map(servicePackages.map((sp) => [sp.name, new Set(sp.addonIds)])),
    [servicePackages],
  );

  // Lọc theo tab đang chọn + sort Basic → Medium → Premium
  const filteredPlans = useMemo(
    () =>
      plans
        .filter((p) => p.durationDays === TAB_DURATION[activeTab])
        .sort(
          (a, b) =>
            (TIER_ORDER[a.servicePackageName] ?? 99) -
            (TIER_ORDER[b.servicePackageName] ?? 99),
        ),
    [plans, activeTab],
  );

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      const res = await remove(planToDelete.id);
      setPlanToDelete(null);
      setSuccessMessage(
        res.message ?? "Subscription plan deleted successfully.",
      );
      reloadPlans();
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setError(message ?? "Failed to delete subscription plan.");
      setPlanToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-page px-margin-mobile py-16 md:px-margin-desktop">
      {/* Header: tiêu đề + nút Add New */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-headline-lg font-bold text-on-surface">
            Unlimited Membership Plans
          </h1>
          <p className="mt-1 font-body text-body-md text-on-surface-variant">
            Manage unlimited wash memberships for individual vehicles.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            navigate("/admin/subscription-plans/create?type=UNLIMIT")
          }
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body text-body-md font-semibold text-on-primary shadow-soft transition-colors hover:bg-primary/90"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add New
        </button>
      </div>

      {/* Thông báo thành công từ Create/Edit */}
      {successMessage && (
        <div className="mt-6 rounded-lg border border-tertiary-fixed-dim/30 bg-tertiary-container px-4 py-3 text-body-md text-on-tertiary-container">
          {successMessage}
        </div>
      )}

      {/* Tab chọn kỳ hạn — pill segmented control */}
      <div className="mt-10 flex justify-center">
        <div className="flex rounded-full border border-outline-variant bg-surface-container-lowest p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-6 py-2 font-body text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-primary text-on-primary shadow-soft"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid cards */}
      <div className="mt-14">
        {error ? (
          <div className="flex h-48 items-center justify-center text-body-md text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-body-md text-on-surface-variant">
            No plans available for this period.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                allAddons={addonServices}
                includedAddonIds={
                  includedAddonIdsByPackageName.get(plan.servicePackageName) ??
                  new Set()
                }
                isDeleting={isDeleting}
                onEdit={(p) =>
                  navigate(`/admin/subscription-plans/${p.id}/edit`)
                }
                onDelete={setPlanToDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa (soft delete → INACTIVE) */}
      <Modal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        variant="danger"
        title="Delete Subscription Plan"
        message={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{planToDelete?.planName}</span>?
            This plan will be set to INACTIVE and hidden from customers.
          </>
        }
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        isConfirmLoading={isDeleting}
      />
    </div>
  );
}

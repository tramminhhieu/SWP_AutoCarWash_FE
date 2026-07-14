import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Users,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { formatCurrency } from "../../../../utils";
import {
  getFamilySubscriptionPlans,
  registerFamilySubscription,
  renewFamilySubscription,
} from "../api/familySubscriptionApi";
import { getApiErrorInfo } from "../../../../lib/axiosClient";
import { getAllAddonServices } from "../../../addon/api/addonApi";
import type {
  FamilySubscriptionPlan,
  CurrentGroup,
} from "../types/familySubscription";
import type { AddonService } from "../../../addon/types/addon";

/* ================================================================
   Hằng số
   ================================================================ */
const TABS = ["1-Month", "3-Month", "6-Month"] as const;
type TabType = (typeof TABS)[number];

const TAB_DURATION: Record<TabType, number> = {
  "1-Month": 30,
  "3-Month": 90,
  "6-Month": 180,
};

/* ================================================================
   Helper: tính pricePerMonth từ price + durationDays
   ================================================================ */
const calcPricePerMonth = (price: number, durationDays: number): number =>
  Math.round(price / (durationDays / 30));

/* ================================================================
   Helper: quyết định CTA cho Customer dựa vào trạng thái group
   ================================================================ */
type CtaVariant =
  | "login"
  | "create-group"
  | "purchase"
  | "renew"
  | "active"
  | "admin";

function resolveCtaVariant(
  isAdmin: boolean,
  isAuthenticated: boolean,
  planId: number,
  currentGroup: CurrentGroup | null,
): CtaVariant {
  if (isAdmin) return "admin";
  if (!isAuthenticated) return "login";
  if (!currentGroup) return "create-group";

  const sub = currentGroup.subscription;
  if (!sub || sub.status === "EXPIRED" || sub.status === "CANCELED") {
    return sub?.subscriptionPlanId === planId ? "renew" : "purchase";
  }
  /* ACTIVE */
  return sub.subscriptionPlanId === planId ? "active" : "purchase";
}

/* ================================================================
   Sub-component: 1 card gói subscription
   ================================================================ */
function PlanCard({
  plan,
  isCurrentPlan,
  allAddons,
  ctaVariant,
  isRegistering,
  onSelectPlan,
  onEdit,
  onDelete,
}: {
  plan: FamilySubscriptionPlan;
  isCurrentPlan: boolean;
  allAddons: AddonService[];
  ctaVariant: CtaVariant;
  isRegistering: boolean;
  onSelectPlan: (
    plan: FamilySubscriptionPlan,
    action: "purchase" | "renew" | "login" | "create-group",
  ) => void;
  onEdit: (plan: FamilySubscriptionPlan) => void;
  onDelete: (plan: FamilySubscriptionPlan) => void;
}) {
  const pricePerMonth = calcPricePerMonth(plan.price, plan.durationDays);

  return (
    <div className="relative flex flex-col">
      <div
        className={`flex h-full flex-col rounded-2xl border p-8 transition-shadow
          ${
            isCurrentPlan
              ? "border-primary bg-primary/5 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.15)]"
              : "border-outline-variant bg-surface-container-lowest shadow-soft"
          }`}
      >
        {/* "Your Current Plan" badge */}
        {isCurrentPlan && (
          <div className="mb-4">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm font-semibold text-primary">
              ✓ Your Current Plan
            </span>
          </div>
        )}

        {/* Plan name + description badge */}
        <h3 className="font-heading text-headline-md font-bold text-on-surface">
          {plan.planName}
        </h3>
        {plan.description && (
          <span className="mt-2 inline-block self-start rounded-full bg-primary/10 px-3 py-1 text-label-sm font-medium text-primary">
            {plan.description}
          </span>
        )}

        {/* Price per month */}
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

        {/* Divider */}
        <div className="my-5 border-t border-outline-variant" />

        {/* Max Vehicles — hiện riêng trước addon list */}
        <div className="mb-4 flex items-center gap-2.5">
          <Users size={16} className="shrink-0 text-primary" strokeWidth={2} />
          <span className="font-body text-body-md font-medium text-on-surface">
            Up to {plan.maxVehicleCount} Vehicles
          </span>
        </div>

        {/* Addon comparison — ✓ xanh / ✕ đỏ */}
        <ul className="flex-1 space-y-2.5">
          {allAddons.map((addon) => {
            const isIncluded = plan.addonIds.includes(addon.id);
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

        {/* CTA section */}
        <div className="mt-8">
          {/* ---- Admin: Edit + Delete ---- */}
          {ctaVariant === "admin" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(plan)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2.5 font-body text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(plan)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-error/30 px-3 py-2.5 font-body text-sm font-medium text-error transition-colors hover:bg-error-container"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}

          {/* ---- Chưa đăng nhập ---- */}
          {ctaVariant === "login" && (
            <button
              type="button"
              onClick={() => onSelectPlan(plan, "login")}
              className="w-full rounded-lg bg-primary px-6 py-3 font-body text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
            >
              Login to Purchase
            </button>
          )}

          {/* ---- Chưa có group ---- */}
          {ctaVariant === "create-group" && (
            <button
              type="button"
              onClick={() => onSelectPlan(plan, "create-group")}
              className="w-full rounded-lg bg-primary px-6 py-3 font-body text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
            >
              Create Family Group
            </button>
          )}

          {/* ---- Mua gói này ---- */}
          {ctaVariant === "purchase" && (
            <button
              type="button"
              onClick={() => onSelectPlan(plan, "purchase")}
              disabled={isRegistering}
              className={`w-full rounded-lg px-6 py-3 font-body text-sm font-semibold transition-colors
                ${
                  isRegistering
                    ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                    : "bg-primary text-on-primary hover:bg-primary/90"
                }`}
            >
              {isRegistering ? "Processing..." : `Select ${plan.planName}`}
            </button>
          )}

          {/* ---- Gia hạn ---- */}
          {ctaVariant === "renew" && (
            <button
              type="button"
              onClick={() => onSelectPlan(plan, "renew")}
              disabled={isRegistering}
              className={`w-full rounded-lg px-6 py-3 font-body text-sm font-semibold transition-colors
                ${
                  isRegistering
                    ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                    : "bg-primary text-on-primary hover:bg-primary/90"
                }`}
            >
              {isRegistering ? "Processing..." : "Renew Plan"}
            </button>
          )}

          {/* ---- Gói đang active (disabled) ---- */}
          {ctaVariant === "active" && (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-lg bg-surface-container-high px-6 py-3 font-body text-sm font-semibold text-on-surface-variant"
            >
              Current Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Sub-component: Skeleton loading card
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
   Page chính: FamilySubscriptionList
   ================================================================ */
export default function FamilySubscriptionList() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  /* ---- State data ---- */
  const [plans, setPlans] = useState<FamilySubscriptionPlan[]>([]);
  const [currentGroup, setCurrentGroup] = useState<CurrentGroup | null>(null);
  const [allAddons, setAllAddons] = useState<AddonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- State: đang gọi API đăng ký ---- */
  const [isRegistering, setIsRegistering] = useState(false);
  /* ---- Toast lỗi từ API đăng ký ---- */
  const [errorToast, setErrorToast] = useState<string | null>(null);

  /* ---- Filter tab ---- */
  const [activeTab, setActiveTab] = useState<TabType>("1-Month");

  /* ---- Load song song plans + addons ---- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [plansRes, addonsRes] = await Promise.all([
          getFamilySubscriptionPlans(),
          getAllAddonServices(),
        ]);
        if (cancelled) return;
        setPlans(plansRes.data.familyPlans);
        setCurrentGroup(plansRes.data.currentGroup);
        setAllAddons(addonsRes);
      } catch {
        if (!cancelled)
          setError("Failed to load subscription plans. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- Filter plans theo tab đang chọn ---- */
  const filteredPlans = useMemo(
    () => plans.filter((p) => p.durationDays === TAB_DURATION[activeTab]),
    [plans, activeTab],
  );

  /* ---- Gộp tất cả addonIds của các plan đang hiển thị → dùng cho comparison ---- */
  const visibleAddonIds = useMemo(
    () => Array.from(new Set(filteredPlans.flatMap((p) => p.addonIds))),
    [filteredPlans],
  );

  /* ---- Chỉ hiển thị addon nào xuất hiện trong ít nhất 1 plan đang visible ---- */
  const visibleAddons = useMemo(
    () => allAddons.filter((a) => visibleAddonIds.includes(a.id)),
    [allAddons, visibleAddonIds],
  );

  /* ---- Handler: chọn gói — gọi API-17-02 cho purchase/renew ---- */
  const handleSelectPlan = async (
    plan: FamilySubscriptionPlan,
    action: "purchase" | "renew" | "login" | "create-group",
  ) => {
    if (action === "login") {
      navigate("/login", { state: { from: "/subscription/family" } });
      return;
    }
    if (action === "create-group") {
      navigate("/family/create");
      return;
    }

    /* purchase / renew → group chưa từng có subscription (API-17-02), ngược lại group đã
       từng có subscription (bất kể ACTIVE/EXPIRED/CANCELED) → luôn dùng API-17-04, kể cả khi
       đổi sang gói khác - "renew" trên BE tự xử lý cả 2 trường hợp gia hạn lẫn đổi gói. */
    if (!currentGroup) return;

    setIsRegistering(true);
    setErrorToast(null);
    try {
      const result = currentGroup.subscription
        ? await renewFamilySubscription({ subscriptionPlanId: plan.id })
        : await registerFamilySubscription({
            familyGroupId: currentGroup.familyGroupId,
            subscriptionPlanId: plan.id,
          });
      /* Thành công → sang màn thanh toán QR dùng chung với luồng Unlimited */
      navigate(`/subscription-plans/payment/${result.invoiceId}`, {
        state: {
          isRenewal: !!currentGroup.subscription,
          redirectTo: "/subscriptions/family/plans",
        },
      });
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);

      /* AUTH_001 → redirect login */
      if (errorCode === "AUTH_001") {
        navigate("/login", { state: { from: "/subscription/family" } });
        return;
      }

      /* Các lỗi nghiệp vụ → hiện toast */
      const toastMsg =
        errorCode === "SUB_001"
          ? "Bạn đã có gói Family đang hoạt động"
          : errorCode === "GROUP_003"
            ? "Không tìm thấy nhóm gia đình"
            : errorCode === "GROUP_004"
              ? "Bạn không phải chủ sở hữu nhóm này"
              : (message ?? "Đăng ký thất bại. Vui lòng thử lại.");

      setErrorToast(toastMsg);
      const timer = setTimeout(() => setErrorToast(null), 4000);
      return () => clearTimeout(timer);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEdit = (plan: FamilySubscriptionPlan) => {
    console.log("Edit plan:", plan.id);
  };

  const handleDelete = (plan: FamilySubscriptionPlan) => {
    console.log("Delete plan:", plan.id);
  };

  /* ================================================================ */
  return (
    <div className="mx-auto max-w-page px-margin-mobile py-20 md:px-margin-desktop">
      {/* ---- Error toast từ API đăng ký ---- */}
      {errorToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-error/30 bg-error-container px-5 py-3 text-body-md font-medium text-on-error-container shadow-soft">
          {errorToast}
        </div>
      )}
      {/* ---- Header ---- */}
      <div className="text-center">
        <h1 className="font-heading text-headline-lg font-bold text-on-surface">
          Family Unlimited Club
        </h1>
        <p className="mt-3 font-body text-body-md text-on-surface-variant">
          Keep the whole household shining with our tiered family detailing
          plans.
        </p>
      </div>

      {/* ---- Admin: Add New button ---- */}
      {isAdmin && (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin/subscription-plans/family/create")}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body text-body-md font-semibold text-on-primary shadow-soft transition-colors hover:bg-primary/90"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add New
          </button>
        </div>
      )}

      {/* ---- Tab filter — pill segmented control ---- */}
      <div className="mt-10 flex justify-center">
        <div className="flex rounded-full border border-outline-variant bg-surface-container-lowest p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-6 py-2 font-body text-sm font-semibold transition-colors
                ${
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

      {/* ---- Grid cards ---- */}
      <div className="mt-14">
        {error ? (
          <div className="flex h-48 items-center justify-center text-base text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            No plans available for this period.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {filteredPlans.map((plan) => {
              const ctaVariant = resolveCtaVariant(
                isAdmin,
                isAuthenticated,
                plan.id,
                currentGroup,
              );
              const isCurrentPlan =
                currentGroup?.subscription?.subscriptionPlanId === plan.id &&
                currentGroup.subscription.status === "ACTIVE";

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={isCurrentPlan}
                  allAddons={visibleAddons}
                  ctaVariant={ctaVariant}
                  isRegistering={isRegistering}
                  onSelectPlan={handleSelectPlan}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { formatCurrency } from "../../../utils";

import { getPlans } from "../api/subscriptionApi";
import {
  getAll as getServicePackages,
  getAllAddonServices,
} from "../../servicepackage/api/servicePackageApi";
import type { CustomerSubscriptionPlan } from "../types/subscription";
import type {
  AddonService,
  ServicePackage,
} from "../../servicepackage/types/servicePackage";

// Nora: kỳ hạn hiện có cho gói Unlimited - khớp data.sql (mỗi combo Basic/Premium
// luôn có đủ 1/3/6 tháng), dùng cho toggle chọn kỳ hạn ở đầu section Unlimited.
const UNLIMITED_DURATION_OPTIONS = [1, 3, 6] as const;
type UnlimitedDurationMonths = (typeof UNLIMITED_DURATION_OPTIONS)[number];

// Nora: gộp các bản ghi cùng "gói" (vd Unlimited Basic 1/3/6 Month) thành 1 card duy nhất,
// bấm chọn kỳ hạn thay vì hiện mỗi kỳ hạn là 1 card riêng. Nhóm theo planType +
// servicePackageName (Basic/Premium) - đúng với cách data.sql tổ hợp 12 gói thật
// (mỗi tổ hợp planType+servicePackage có 2-3 kỳ hạn: 1/3/6 tháng).
function groupKey(plan: CustomerSubscriptionPlan): string {
  return `${plan.planType}|${plan.servicePackageName}`;
}

function durationLabel(days: number): string {
  const months = Math.round(days / 30);
  return `${months} Month${months > 1 ? "s" : ""}`;
}

/** Card gói Unlimited theo mockup mới: badge "BEST VALUE" nổi bật cho tier Premium,
 * checklist addon lấy từ ServicePackage thật (không bịa nội dung), kỳ hạn được điều
 * khiển từ toggle chung ở section thay vì mỗi card tự chọn kỳ hạn riêng. */
function UnlimitedPlanCard({
  variant,
  allAddons,
  includedAddonIds,
  onSubscribe,
}: {
  variant: CustomerSubscriptionPlan;
  allAddons: AddonService[];
  includedAddonIds: Set<number>;
  onSubscribe: (planId: number) => void;
}) {
  return (
    <div className="relative flex h-full flex-col rounded-2xl bg-surface-container-lowest p-8 border border-outline-variant shadow-soft">
      <div className="flex-1">
        <h3 className="font-heading text-headline-md font-bold text-on-surface">
          Unlimited {variant.servicePackageName}
        </h3>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {variant.description}
        </p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="font-heading text-headline-md font-bold text-on-surface">
            {formatCurrency(variant.price)}
          </span>
          <span className="text-body-md text-on-surface-variant">
            / {durationLabel(variant.durationDays)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
            <CalendarClock size={14} />
            {variant.durationDays} days
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
            {variant.servicePackageName}
          </span>
        </div>

        {allAddons.length > 0 && (
          <ul className="mt-6 space-y-2.5">
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
                    className={`text-body-sm ${
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

      <button
        type="button"
        onClick={() => onSubscribe(variant.id)}
        className="mt-8 w-full rounded-lg bg-primary px-6 py-3 text-center text-body-md font-semibold text-on-primary hover:opacity-90"
      >
        Select {variant.servicePackageName}
      </button>
    </div>
  );
}

export default function SubscriptionPlanList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<CustomerSubscriptionPlan[]>([]);
  // Chỉ dùng để lấy addons thật (checklist) cho card Unlimited - lỗi ở call này không
  // nên chặn cả trang, nên catch riêng và fallback [] (card Unlimited vẫn hiện, chỉ
  // thiếu checklist).
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  // BE chỉ trả addonIds (id thô) trong ServicePackage - cần danh sách AddonService riêng
  // để resolve ra tên hiển thị cho checklist card Unlimited.
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [selectedMonths, setSelectedMonths] =
    useState<UnlimitedDurationMonths>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getPlans(),
      getServicePackages().catch(() => []),
      getAllAddonServices().catch(() => []),
    ])
      .then(([plansData, packagesData, addonsData]) => {
        if (isMounted) {
          setPlans(plansData);
          setServicePackages(packagesData);
          setAddonServices(addonsData);
        }
      })
      .catch(() => {
        if (isMounted)
          setError("Failed to load subscription plans. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // servicePackageName -> Set<addonId> đã có trong ServicePackage (Basic/Medium/Premium), match
  // theo servicePackageName trên CustomerSubscriptionPlan để hiện checklist ✓/✗ cho card Unlimited
  // (đồng bộ với ServicePackageList.tsx / FamilySubscriptionList.tsx - hiện TẤT CẢ addon, không
  // chỉ addon đã có).
  const includedAddonIdsByPackageName = useMemo(
    () => new Map(servicePackages.map((sp) => [sp.name, new Set(sp.addonIds)])),
    [servicePackages],
  );

  // Thứ tự hiển thị card: Basic → Medium → Premium (tăng dần theo tier)
  const TIER_ORDER: Record<string, number> = {
    Basic: 0,
    Medium: 1,
    Premium: 2,
  };

  // Lọc cứng UNLIMIT + gộp các kỳ hạn (1/3/6 tháng) của cùng 1 gói thành 1 nhóm,
  // sort theo tier Basic→Medium→Premium để thứ tự card luôn đúng.
  const unlimitGroupedList = useMemo(() => {
    const unlimitPlans = plans.filter((p) => p.planType === "UNLIMIT");
    const groups = new Map<string, CustomerSubscriptionPlan[]>();
    for (const plan of unlimitPlans) {
      const key = groupKey(plan);
      const existing = groups.get(key);
      if (existing) existing.push(plan);
      else groups.set(key, [plan]);
    }
    // Sort group theo tier: Basic → Medium → Premium
    return Array.from(groups.values()).sort(
      (a, b) =>
        (TIER_ORDER[a[0].servicePackageName] ?? 99) -
        (TIER_ORDER[b[0].servicePackageName] ?? 99),
    );
  }, [plans]);

  // FE-60-US-02.1: chưa login -> chuyển sang /login kèm "from" để quay lại đúng bước
  // chọn xe sau khi login, giống pattern handleSelectPackage ở ServicePackageList.tsx.
  function handleSubscribe(planId: number) {
    const target = `/subscription-plans/${planId}/register`;
    if (isAuthenticated) {
      navigate(target);
    } else {
      navigate("/login", { state: { from: target } });
    }
  }

  return (
    <div className="max-w-page mx-auto px-margin-mobile py-16 md:px-margin-desktop">
      <div className="text-center">
        <h1 className="font-heading text-headline-lg text-on-surface">
          Membership Plans
        </h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          Wash more, pay less. Choose the membership that fits your household.
        </p>
      </div>

      <div className="mt-12">
        {error ? (
          <div className="flex h-48 items-center justify-center text-body-md text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center text-body-md text-on-surface-variant">
            Loading...
          </div>
        ) : unlimitGroupedList.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-body-md text-on-surface-variant">
            No subscription plans available.
          </div>
        ) : (
          <>
            {/* Toggle kỳ hạn dùng chung - chọn 1 lần, mọi card đổi giá theo */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full bg-surface-container p-1">
                {UNLIMITED_DURATION_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonths(m)}
                    className={`rounded-full px-5 py-2 text-label-md font-semibold transition-colors ${
                      selectedMonths === m
                        ? "bg-primary text-on-primary shadow-soft"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {durationLabel(m * 30)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {unlimitGroupedList.map((variants) => {
                const selected =
                  variants.find(
                    (v) => v.durationDays === selectedMonths * 30,
                  ) ?? variants[variants.length - 1];
                return (
                  <UnlimitedPlanCard
                    key={groupKey(variants[0])}
                    variant={selected}
                    allAddons={addonServices}
                    includedAddonIds={
                      includedAddonIdsByPackageName.get(
                        selected.servicePackageName,
                      ) ?? new Set()
                    }
                    onSubscribe={handleSubscribe}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

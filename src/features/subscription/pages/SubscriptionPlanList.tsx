import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, CarFront } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { formatCurrency } from "../../../utils";
import {
  getSubscriptionStyle,
  getSubscriptionTypeLabel,
} from "../../../constants/subscriptionStyles";
import { getPlans } from "../api/subscriptionApi";
import type { CustomerSubscriptionPlan, PlanType } from "../types/subscription";

const SECTION_ORDER: { type: PlanType; title: string; subtitle: string }[] = [
  {
    type: "UNLIMIT",
    title: "Unlimited Membership",
    subtitle: "Unlimited washes for a single vehicle.",
  },
  {
    type: "FAMILY",
    title: "Family Membership",
    subtitle: "One shared plan for the whole household's vehicles.",
  },
];

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

function PlanGroupCard({
  variants,
  onSubscribe,
}: {
  variants: CustomerSubscriptionPlan[]; // cùng 1 gói, khác kỳ hạn - đã sort tăng dần theo durationDays
  onSubscribe: (planId: number) => void;
}) {
  const [selectedId, setSelectedId] = useState(variants[0].id);
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const style = getSubscriptionStyle(selected.planType);
  const baseName = `${selected.planType === "UNLIMIT" ? "Unlimited" : "Family"} ${selected.servicePackageName}`;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-body-lg font-bold text-on-surface">
            {baseName}
          </h3>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-label-sm font-bold uppercase tracking-wider ${style.badge} ${style.border}`}
          >
            {getSubscriptionTypeLabel(selected.planType)}
          </span>
        </div>

        <p className="mt-2 text-body-md text-on-surface-variant">
          {selected.description}
        </p>

        {/* Chọn kỳ hạn - giá/mô tả bên dưới đổi theo kỳ hạn đang chọn */}
        {variants.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`rounded-lg border px-3 py-1.5 text-label-sm font-semibold transition-colors ${
                  v.id === selectedId
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {durationLabel(v.durationDays)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-baseline gap-1">
          <span className="font-heading text-headline-md font-bold text-on-surface">
            {formatCurrency(selected.price)}
          </span>
          <span className="text-body-md text-on-surface-variant">
            / {durationLabel(selected.durationDays)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
            <CalendarClock size={14} />
            {selected.durationDays} days
          </span>
          {/* FE-60-US-01 AC02: max_vehicle_count chỉ hiển thị "đối với FAMILY" - UNLIMITED
              luôn = 1 nên hiện ra không có ý nghĩa, chỉ FAMILY mới cần biết cap chia sẻ. */}
          {selected.planType === "FAMILY" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
              <CarFront size={14} />
              Up to {selected.maxVehicleCount ?? 1} vehicle
              {(selected.maxVehicleCount ?? 1) > 1 ? "s" : ""}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
            {selected.servicePackageName}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSubscribe(selected.id)}
        className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-center text-body-md font-semibold text-on-primary hover:opacity-90"
      >
        Subscribe
      </button>
    </div>
  );
}

export default function SubscriptionPlanList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  // Home.tsx "Get Started" theo từng loại (Unlimited/Family) truyền ?type=UNLIMIT|FAMILY để
  // chỉ hiện đúng loại đó. Không truyền (vd link "Browse plans" khác) -> hiện cả 2 như cũ.
  const typeParam = searchParams.get("type");
  const sections =
    typeParam === "UNLIMIT" || typeParam === "FAMILY"
      ? SECTION_ORDER.filter((s) => s.type === typeParam)
      : SECTION_ORDER;
  const [plans, setPlans] = useState<CustomerSubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getPlans()
      .then((data) => {
        if (isMounted) setPlans(data);
      })
      .catch(() => {
        if (isMounted) setError("Failed to load subscription plans. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
        ) : plans.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-body-md text-on-surface-variant">
            No subscription plans available.
          </div>
        ) : (
          <div className="space-y-14">
            {sections.map((section) => {
              const sectionPlans = plans.filter((p) => p.planType === section.type);
              if (sectionPlans.length === 0) return null;

              // Gộp các kỳ hạn (1/3/6 tháng) của cùng 1 gói vào 1 nhóm, sort tăng dần
              // theo durationDays để nút kỳ hạn hiện theo đúng thứ tự 1 -> 3 -> 6 tháng.
              const groups = new Map<string, CustomerSubscriptionPlan[]>();
              for (const plan of sectionPlans) {
                const key = groupKey(plan);
                const existing = groups.get(key);
                if (existing) existing.push(plan);
                else groups.set(key, [plan]);
              }
              const groupedList = Array.from(groups.values()).map((variants) =>
                [...variants].sort((a, b) => a.durationDays - b.durationDays),
              );

              return (
                <div key={section.type}>
                  <h2 className="font-heading text-headline-md text-on-surface">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {section.subtitle}
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {groupedList.map((variants) => (
                      <PlanGroupCard
                        key={groupKey(variants[0])}
                        variants={variants}
                        onSubscribe={handleSubscribe}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

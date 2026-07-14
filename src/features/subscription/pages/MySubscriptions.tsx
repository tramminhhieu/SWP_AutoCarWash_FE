import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Car, RefreshCw, XCircle } from "lucide-react";
import Loading from "../../../components/ui/Loading";
import Modal from "../../../components/ui/Modal";
import { formatCurrency, formatDate } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { cancel, getMySubscriptions, renew } from "../api/subscriptionApi";
import type { UnlimitedSubscription } from "../types/subscription";

const STATUS_BADGE: Record<UnlimitedSubscription["status"], string> = {
  ACTIVE: "bg-on-primary/15 text-on-primary",
  EXPIRED: "bg-on-primary/15 text-on-primary/70",
  CANCELED: "bg-on-primary/15 text-on-primary/70",
};

// planName thật dạng "Unlimited Premium 3 Months" (data.sql) - tách số tháng ra để hiện
// badge "3-Month Plan" trên banner, cùng pattern với FamilyGroupDetail.tsx, không bịa field mới.
function parsePlanDurationLabel(planName: string): string | null {
  const match = planName.match(/(\d+)\s*Months?/i);
  if (!match) return null;
  return `${match[1]}-Month Plan`;
}

// BL-SP-07: hệ thống phải cảnh báo khách trước 3 ngày so với ngày hết hạn gói. Chưa có hệ
// thống thông báo (email/push) ở FE/BE nên hiện cảnh báo ngay trên card thay thế - tính số
// ngày còn lại từ endDate, chỉ áp dụng cho gói đang ACTIVE.
function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function SubscriptionCard({
  sub,
  onCancel,
  onRenew,
  isRenewing,
}: {
  sub: UnlimitedSubscription;
  onCancel: () => void;
  onRenew: () => void;
  isRenewing: boolean;
}) {
  const daysLeft = daysUntil(sub.endDate);
  const isExpiringSoon = sub.status === "ACTIVE" && daysLeft >= 0 && daysLeft <= 3;
  const planDurationLabel = parsePlanDurationLabel(sub.planName);

  const canCancel = sub.status === "ACTIVE";
  // FE-56-US-02 AC01: chỉ hiện Renew khi ACTIVE và còn <=3 ngày trước hết hạn.
  const canRenew = isExpiringSoon;
  const hasAnyAction = canCancel || canRenew;

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
      {/* Banner hero - cùng ngôn ngữ thiết kế với FamilyGroupDetail.tsx: tên gói + badge
          kỳ hạn + mô tả bên trái, số liệu nổi bật bên phải (days left khi ACTIVE, status
          khi không còn active). */}
      <div className="bg-primary p-6 text-on-primary">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-heading text-headline-md font-bold">{sub.planName}</h3>
              {planDurationLabel && (
                <span className="rounded-full bg-on-primary/15 px-3 py-1 text-label-sm font-semibold">
                  {planDurationLabel}
                </span>
              )}
            </div>
            <p className="mt-2 text-body-md text-on-primary/80">
              {sub.description || "Unlimited washes for a single vehicle."}
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-on-primary/10 px-5 py-3 text-center">
            <p className="text-label-sm font-bold uppercase tracking-wider text-on-primary/70">
              {sub.status === "ACTIVE" ? "Days Left" : "Status"}
            </p>
            {sub.status === "ACTIVE" ? (
              <p className="mt-1 font-heading text-headline-md font-bold">
                {Math.max(daysLeft, 0)}
              </p>
            ) : (
              <p
                className={`mt-1 rounded-full px-2.5 py-0.5 text-label-sm font-bold uppercase tracking-wider ${STATUS_BADGE[sub.status]}`}
              >
                {sub.status}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {isExpiringSoon && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-2 text-label-sm font-semibold text-secondary">
            <AlertTriangle size={14} />
            {daysLeft === 0
              ? "Expires today - renew now to keep your benefits."
              : `Expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""} - renew now to keep your benefits.`}
          </div>
        )}

        {/* Hàng thông tin xe - cùng kiểu "member row" với FamilyGroupDetail.tsx (icon tròn
            bên trái, thông tin chính giữa, chip biển số bên phải). */}
        <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Car size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md font-semibold text-on-surface">
              {sub.vehicle.vehicleName}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {sub.servicePackageName} Package
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-label-sm font-semibold text-on-surface">
            {sub.vehicle.licensePlate}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-label-sm">
          <div>
            <p className="text-on-surface-variant">Start</p>
            <p className="font-semibold text-on-surface">{formatDate(sub.startDate)}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">End</p>
            <p className="font-semibold text-on-surface">{formatDate(sub.endDate)}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">Price</p>
            <p className="font-semibold text-on-surface">{formatCurrency(sub.price)}</p>
          </div>
        </div>

        {hasAnyAction && (
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-outline-variant pt-4">
            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 text-label-md font-semibold text-error hover:opacity-80"
              >
                <XCircle size={15} />
                Cancel
              </button>
            )}
            {/* FE-56-US-02 AC01: nút Renew CHỈ hiện khi ACTIVE và còn <=3 ngày trước hết hạn -
                không hiện suốt vòng đời sub như trước, cũng không hiện cho EXPIRED (AC03: renew
                phải bị từ chối nếu sub không còn ACTIVE). */}
            {canRenew && (
              <button
                type="button"
                onClick={onRenew}
                disabled={isRenewing}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-label-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                <RefreshCw size={15} />
                {isRenewing ? "Preparing..." : "Renew"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// FE-60-US-05 (view) + FE-58-US-01 (cancel) + FE-56-US-02 (renew entry point).
// FE-59 (transfer vehicle) đã có sẵn ở /customer/profile, không lặp lại ở đây.
export default function MySubscriptions() {
  const navigate = useNavigate();
  const location = useLocation();

  const [subscriptions, setSubscriptions] = useState<UnlimitedSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ?? null,
  );

  const [subToCancel, setSubToCancel] = useState<UnlimitedSubscription | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [renewingId, setRenewingId] = useState<number | null>(null);

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getMySubscriptions()
      .then(setSubscriptions)
      .catch(() => setError("Unable to load your subscriptions. Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirmCancel = async () => {
    if (!subToCancel) return;
    setIsCancelling(true);
    try {
      const res = await cancel(subToCancel.id);
      setSubToCancel(null);
      setSuccessMessage(res.message);
      load();
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setError(message ?? "Unable to cancel subscription.");
      setSubToCancel(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRenew = async (sub: UnlimitedSubscription) => {
    setRenewingId(sub.id);
    setError(null);
    try {
      const result = await renew(sub.id);
      navigate(`/subscription-plans/payment/${result.invoiceId}`, {
        state: { isRenewal: true },
      });
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setError(message ?? "Unable to start renewal. Please try again.");
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-margin-mobile py-12 md:px-margin-desktop">
      <h1 className="font-heading text-headline-lg text-on-surface">
        My Subscriptions
      </h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        Manage your membership plans and vehicles.
      </p>

      {successMessage && (
        <div className="mt-4 rounded-lg border border-tertiary-fixed-dim/30 bg-tertiary-container px-4 py-3 text-body-md text-on-tertiary-container">
          {successMessage}
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <Loading rows={3} />
        ) : error ? (
          <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-12 text-center">
            <p className="text-body-md text-on-surface-variant">
              You don't have any subscriptions yet.
            </p>
            <button
              type="button"
              onClick={() => navigate("/subscription-plans")}
              className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90"
            >
              Browse Plans
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onCancel={() => setSubToCancel(sub)}
                onRenew={() => handleRenew(sub)}
                isRenewing={renewingId === sub.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* FE-58-US-01 AC01: popup xác nhận trước khi hủy */}
      <Modal
        isOpen={!!subToCancel}
        onClose={() => setSubToCancel(null)}
        variant="danger"
        title="Cancel Subscription"
        message={
          <>
            You have{" "}
            <span className="font-semibold">
              {subToCancel ? daysUntil(subToCancel.endDate) : 0} day(s)
            </span>{" "}
            left on <span className="font-semibold">{subToCancel?.planName}</span> for{" "}
            <span className="font-semibold">{subToCancel?.vehicle.licensePlate}</span>. Canceling
            now forfeits all remaining benefits immediately — no refund.
          </>
        }
        confirmText="Cancel Subscription"
        onConfirm={handleConfirmCancel}
        isConfirmLoading={isCancelling}
      />
    </div>
  );
}

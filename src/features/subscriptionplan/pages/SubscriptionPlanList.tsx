import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Loading from "../../../components/ui/Loading";
import { formatCurrency } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getSubscriptionStyle, getSubscriptionTypeLabel } from "../../../constants/subscriptionStyles";
import { getAll, remove } from "../api/subscriptionPlanApi";
import type {
  PlanStatus,
  PlanStatusFilter,
  PlanType,
  PlanTypeFilter,
  SubscriptionPlan,
} from "../types/subscriptionPlan";

// Badge trạng thái (ACTIVE/INACTIVE) - is_deleted trong DB thật, không có style constant
// riêng nên dùng cùng "ngôn ngữ" pill với subscriptionStyles.ts (tertiary = tích cực).
const STATUS_BADGE: Record<SubscriptionPlan["status"], string> = {
  ACTIVE: "bg-tertiary/10 text-tertiary border-tertiary/30",
  INACTIVE: "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
};

// 1 dropdown duy nhất gộp Status + Type, option phẳng - chọn 1 tại 1 thời điểm (không kết hợp được
// Status + Type cùng lúc nữa, đổi lấy UI gọn hơn). BE vẫn nhận 2 param status/type riêng như cũ,
// xem toStatusAndType() bên dưới để suy ra cặp giá trị gửi lên từ 1 lựa chọn duy nhất.
type CombinedFilter = "ALL" | PlanStatus | PlanType;
const FILTER_OPTIONS: CombinedFilter[] = ["ALL", "ACTIVE", "INACTIVE", "FAMILY", "UNLIMIT"];

function toStatusAndType(
  f: CombinedFilter,
): { status: PlanStatusFilter; type: PlanTypeFilter } {
  if (f === "ACTIVE" || f === "INACTIVE") return { status: f, type: "ALL" };
  if (f === "FAMILY" || f === "UNLIMIT") return { status: "ALL", type: f };
  return { status: "ALL", type: "ALL" };
}

// <select> dùng chung cho 2 dropdown filter bên dưới - cùng style input/select trong
// SubscriptionPlanForm.tsx (appearance-none + icon ChevronDown tự vẽ để canh đều mọi trình duyệt).
function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  labelForOption,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  labelForOption: (option: T) => string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-4 pr-10 text-label-md font-semibold text-on-surface outline-none transition-colors focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labelForOption(o)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={2.25}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
    </div>
  );
}

export default function SubscriptionPlanList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState<CombinedFilter>("ALL");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FE-53-US-04: state cho popup xác nhận xóa (soft delete)
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // AC05 (US-02/US-03): thông báo thành công truyền qua router state từ trang Create/Edit
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ?? null,
  );

  // Xoá message khỏi history state sau khi đã hiển thị, để F5/back không hiện lại
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = useCallback((f: CombinedFilter) => {
    setIsLoading(true);
    setError(null);
    const { status, type } = toStatusAndType(f);
    getAll(status, type)
      .then((data) => setPlans(data))
      .catch((err) => {
        const { message } = getApiErrorInfo(err);
        setError(message ?? "Failed to retrieve subscription plans.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadPlans(filter);
  }, [filter, loadPlans]);

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      const res = await remove(planToDelete.id);
      setPlanToDelete(null);
      setSuccessMessage(res.message ?? "Subscription plan deleted successfully.");
      loadPlans(filter);
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setError(message ?? "Failed to delete subscription plan.");
      setPlanToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-lg text-on-surface">
            Subscription Plans
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Manage membership plans offered to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/subscription-plans/create")}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90"
        >
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {/* AC01: 1 dropdown duy nhất gộp Status + Type */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FilterSelect
          value={filter}
          onChange={setFilter}
          options={FILTER_OPTIONS}
          labelForOption={(f) => (f === "FAMILY" || f === "UNLIMIT" ? getSubscriptionTypeLabel(f) : f)}
        />
      </div>

      {successMessage && (
        <div className="mt-4 rounded-lg border border-tertiary-fixed-dim/30 bg-tertiary-container px-4 py-3 text-body-md text-on-tertiary-container">
          {successMessage}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        {isLoading ? (
          <Loading rows={5} />
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-body-md text-error">
            {error}
          </div>
        ) : plans.length === 0 ? (
          // AC04: empty state
          <div className="flex h-40 items-center justify-center text-body-md text-on-surface-variant">
            No subscription plans found.
          </div>
        ) : (
          <table className="w-full text-left text-body-md">
            <thead className="bg-surface-container text-label-sm uppercase text-on-surface-variant">
              <tr>
                {/* AC02: KHÔNG hiển thị id (AC03) */}
                <th className="px-4 py-3 font-semibold">Plan Name</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Duration (days)</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Max Vehicles</th>
                <th className="px-4 py-3 font-semibold">Service Package</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {plans.map((plan) => {
                const typeStyle = getSubscriptionStyle(plan.planType);
                return (
                  <tr key={plan.id} className="hover:bg-surface-container/50">
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {plan.planName}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(plan.price)}</td>
                    <td className="px-4 py-3">{plan.durationDays}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-sm font-bold uppercase tracking-wider ${typeStyle.badge} ${typeStyle.border}`}
                      >
                        {plan.planType}
                      </span>
                    </td>
                    <td className="px-4 py-3">{plan.maxVehicleCount ?? "—"}</td>
                    <td className="px-4 py-3">{plan.servicePackageName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-sm font-bold uppercase tracking-wider ${STATUS_BADGE[plan.status]}`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/subscription-plans/${plan.id}/edit`)
                          }
                          className="text-label-md font-semibold text-primary hover:opacity-80"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlanToDelete(plan)}
                          disabled={plan.status === "INACTIVE"}
                          className="flex items-center gap-1 text-label-md font-semibold text-error hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* FE-53-US-04 AC01: popup xác nhận trước khi xóa (soft delete) */}
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

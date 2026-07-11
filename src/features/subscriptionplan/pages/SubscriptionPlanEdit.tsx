import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../../components/ui/Loading";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getById } from "../api/subscriptionPlanApi";
import SubscriptionPlanForm from "../components/SubscriptionPlanForm";
import type { SubscriptionPlanDetail } from "../types/subscriptionPlan";

// FE-53-US-03
export default function SubscriptionPlanEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const planId = Number(id);

  const [plan, setPlan] = useState<SubscriptionPlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId || Number.isNaN(planId)) {
      setError("Invalid subscription plan.");
      setIsLoading(false);
      return;
    }

    // AC01: pre-fill toàn bộ dữ liệu hiện tại
    getById(planId)
      .then((data) => setPlan(data))
      .catch((err) => {
        const { message } = getApiErrorInfo(err);
        setError(message ?? "Subscription plan not found.");
      })
      .finally(() => setIsLoading(false));
  }, [planId]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-headline-lg text-on-surface">
        Edit Subscription Plan
      </h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        Update plan details.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <Loading rows={5} />
        ) : error ? (
          <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        ) : plan ? (
          <SubscriptionPlanForm
            planId={plan.id}
            initialData={{
              planName: plan.planName,
              price: plan.price,
              durationDays: plan.durationDays,
              description: plan.description,
              servicePackageId: plan.servicePackageId,
              planType: plan.planType,
              maxVehicleCount: plan.maxVehicleCount,
              status: plan.status,
            }}
            // AC05: cập nhật thành công -> thông báo + refresh list
            onSuccess={() =>
              navigate("/admin/subscription-plans", {
                state: {
                  successMessage: "Subscription plan updated successfully.",
                },
              })
            }
            onCancel={() => navigate("/admin/subscription-plans")}
          />
        ) : null}
      </div>
    </div>
  );
}

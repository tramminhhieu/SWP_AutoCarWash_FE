import { Navigate, useNavigate, useParams } from "react-router-dom";
import SubscriptionPlanForm from "../components/SubscriptionPlanForm";
import type { PlanType } from "../types/subscriptionPlan";

// Map :type trên URL (đến từ SubscriptionPlanTypeSelect) -> planType thật + nội dung hiển thị
const TYPE_CONFIG: Record<string, { planType: PlanType; title: string; subtitle: string }> = {
  unlimited: {
    planType: "UNLIMIT",
    title: "Create Unlimited Membership",
    subtitle: "Unlimited wash package for a single vehicle.",
  },
  family: {
    planType: "FAMILY",
    title: "Create Family Membership",
    subtitle: "Shared membership package for multiple vehicles.",
  },
};

// FE-53-US-02
export default function SubscriptionPlanCreate() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const config = type ? TYPE_CONFIG[type] : undefined;

  // URL /admin/subscription-plans/:type/create không hợp lệ -> quay lại màn chọn loại
  if (!config) {
    return <Navigate to="/admin/subscription-plans/create" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-headline-lg text-on-surface">{config.title}</h1>
      <p className="mt-1 text-body-md text-on-surface-variant">{config.subtitle}</p>

      <div className="mt-6">
        <SubscriptionPlanForm
          fixedPlanType={config.planType}
          // AC05: tạo thành công -> thông báo + quay về list (list tự refresh khi mount)
          onSuccess={() =>
            navigate("/admin/subscription-plans", {
              state: { successMessage: "Subscription plan created successfully." },
            })
          }
          onCancel={() => navigate("/admin/subscription-plans/create")}
        />
      </div>
    </div>
  );
}

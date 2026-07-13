import { useNavigate } from "react-router-dom";
import { ArrowLeft, Infinity as InfinityIcon, Puzzle, Users } from "lucide-react";
import type { ReactNode } from "react";

interface TypeOption {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
}

// 3 loại admin có thể tạo, theo đúng prototype "Select Package Type" (đã bỏ "Service Package"
// vì trang đó là single-wash service, không thuộc phạm vi Subscription Plan / FE-53).
const OPTIONS: TypeOption[] = [
  {
    key: "unlimited",
    title: "Unlimited Membership",
    description: "Subscription-based unlimited wash package for 1 vehicle.",
    icon: <InfinityIcon size={26} />,
    path: "/admin/subscription-plans/unlimited/create",
  },
  {
    key: "family",
    title: "Family Membership",
    description: "Shared membership package with multiple vehicles.",
    icon: <Users size={26} />,
    path: "/admin/subscription-plans/family/create",
  },
  {
    key: "addon",
    title: "Add-on",
    description: "Supplemental service that can be added to any base wash package.",
    icon: <Puzzle size={26} />,
    path: "/admin/addon-services/create",
  },
];

export default function SubscriptionPlanTypeSelect() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back luôn về thẳng list (không dùng navigate(-1)) vì trang này có thể được mở
          trực tiếp bằng URL - lịch sử SPA lúc đó rỗng, back theo history sẽ không hoạt động. */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/admin/subscription-plans")}
          aria-label="Back to Subscription Plans"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading text-headline-lg text-on-surface">
            Select Package Type
          </h1>
          <p className="mt-0.5 text-body-md text-on-surface-variant">
            Choose a package type to continue.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => navigate(opt.path)}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-left shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_14px_28px_-6px_rgba(29,78,216,0.12)]"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
              {opt.icon}
            </span>
            <span className="font-heading text-body-lg font-bold text-on-surface">
              {opt.title}
            </span>
            <span className="text-body-md text-on-surface-variant">
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

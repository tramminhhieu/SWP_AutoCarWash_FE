import { useLocation, useNavigate } from "react-router-dom";
import { Clock, QrCode } from "lucide-react";
import { formatDate } from "../../../../utils";

interface FamilyPaymentPendingState {
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
}

// Màn "chuyển khoản" tạm thời sau khi đăng ký/gia hạn gói Family thành công. BE hiện chưa trả
// invoice/QR cho luồng Family (khác Unlimited - xem SubscriptionPayment.tsx), nên trang này chỉ
// xác nhận thông tin gói + placeholder QR, sẽ nối QR thật khi BE bổ sung invoice cho Family.
export default function FamilyPaymentPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FamilyPaymentPendingState | null;

  return (
    <div className="mx-auto max-w-xl px-margin-mobile py-16 md:px-margin-desktop">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
        <h1 className="font-heading text-headline-lg text-on-surface">
          Family Plan Confirmed
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Your family subscription request has been recorded.
        </p>

        {state && (
          <div className="mt-6 rounded-xl border border-outline-variant/40 bg-surface-container p-4 text-left">
            <p className="text-body-md font-semibold text-on-surface">
              {state.planName} · {state.status}
            </p>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {formatDate(state.startDate)} - {formatDate(state.endDate)}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container p-8">
          <QrCode size={40} className="text-on-surface-variant" />
          <p className="flex items-center gap-1.5 text-body-md font-medium text-on-surface-variant">
            <Clock size={16} />
            Payment QR coming soon
          </p>
          <p className="text-label-sm text-on-surface-variant">
            Bank transfer QR payment for Family plans will be available soon.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/family")}
          className="mt-8 w-full rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90"
        >
          Back to My Family
        </button>
      </div>
    </div>
  );
}

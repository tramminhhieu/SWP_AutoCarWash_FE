import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, QrCode } from "lucide-react";
import Loading from "../../../components/ui/Loading";
import { formatCurrency, formatDateTime } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getPaymentInfo, simulatePaymentSuccess } from "../api/subscriptionApi";
import type { SubscriptionPaymentInfo } from "../types/subscription";

// FE-60-US-02.1 step 3 + FE-56-US-05 (dùng chung màn này cho cả đăng ký mới và gia hạn,
// vì cả 2 đều tạo ra 1 invoice rồi trỏ khách sang đây thanh toán QR).
export default function SubscriptionPayment() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const id = Number(invoiceId);

  const [payment, setPayment] = useState<SubscriptionPaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoadError("Invalid invoice.");
      setIsLoading(false);
      return;
    }
    getPaymentInfo(id)
      .then(setPayment)
      .catch((err) => {
        const { message } = getApiErrorInfo(err);
        setLoadError(message ?? "Unable to load payment information.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // Chưa có cổng thanh toán thật (Note.md chưa cho endpoint webhook/polling) - nút này
  // giả lập việc thanh toán QR thành công để test hết luồng FE-56-US-05 (thông báo
  // thành công/thất bại sau khi gia hạn/đăng ký).
  const handleSimulatePayment = async () => {
    setIsConfirming(true);
    setConfirmError(null);
    try {
      const res = await simulatePaymentSuccess(id);
      if (!res.success) throw new Error("Payment failed");
      navigate("/subscription", {
        state: {
          successMessage: payment?.isRenewal
            ? "Payment successful. Your membership has been renewed."
            : "Payment successful. Your membership is now active.",
        },
      });
    } catch {
      setConfirmError("Payment failed. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-margin-mobile py-16 md:px-margin-desktop">
      <div className="text-center">
        <h1 className="font-heading text-headline-lg text-on-surface">
          Secure Payment
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Scan the QR code with your banking app to complete payment.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <Loading rows={3} />
        ) : loadError ? (
          <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {loadError}
          </div>
        ) : payment ? (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <div className="flex items-center justify-center gap-2 border-b border-outline-variant pb-4">
              <QrCode size={18} className="text-primary" />
              <h2 className="font-heading text-body-lg font-bold text-on-surface">
                {payment.planName}
              </h2>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="rounded-xl border border-outline-variant bg-white p-3">
                <img
                  src={payment.qrCode}
                  alt="Payment QR code"
                  width={220}
                  height={220}
                  className="size-[220px]"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-body-md">
              <span className="text-on-surface-variant">Amount</span>
              <span className="font-heading text-body-lg font-bold text-on-surface">
                {formatCurrency(payment.finalAmount)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-label-sm">
              <span className="text-on-surface-variant">Expires at</span>
              <span className="text-on-surface-variant">
                {formatDateTime(payment.expiredAt)}
              </span>
            </div>

            {confirmError && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
                {confirmError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isConfirming}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors ${
                isConfirming
                  ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                  : "bg-primary text-on-primary hover:opacity-90"
              }`}
            >
              {isConfirming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {isConfirming ? "Confirming..." : "I've Completed Payment"}
            </button>
            <p className="mt-3 text-center text-label-sm text-on-surface-variant">
              Demo mode: no real payment gateway is connected yet.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

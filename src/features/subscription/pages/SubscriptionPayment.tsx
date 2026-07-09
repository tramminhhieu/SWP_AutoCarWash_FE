import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Check, Copy, Loader2, QrCode } from "lucide-react";
import Loading from "../../../components/ui/Loading";
import { formatCurrency, formatDate, formatDateTime } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getInvoiceStatus } from "../api/subscriptionApi";
import type { SubscriptionPaymentInit } from "../types/subscription";

const POLL_INTERVAL_MS = 4000;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// FE-US-56-04: dùng chung màn này cho cả đăng ký mới và gia hạn - cả 2 đều tạo ra 1 invoice
// PENDING rồi trỏ khách sang đây quét QR; trang tự poll GET /api/subscriptions/invoices/{id}
// tới khi BE (qua webhook ngân hàng) xác nhận PAID/FAILED, không còn nút giả lập thanh toán.
export default function SubscriptionPayment() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const id = Number(invoiceId);
  // isRenewal không có trong response BE - đọc lại từ navigation state do trang gọi
  // register()/renew() truyền qua (xem SubscriptionRegister.tsx / MySubscriptions.tsx).
  const isRenewal = Boolean((location.state as { isRenewal?: boolean } | null)?.isRenewal);

  const [payment, setPayment] = useState<SubscriptionPaymentInit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<"content" | "account" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoadError("Invalid invoice.");
      setIsLoading(false);
      return;
    }

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const fetchStatus = () => {
      getInvoiceStatus(id)
        .then((data) => {
          setPayment(data);
          if (data.invoiceStatus !== "PENDING") {
            stopPolling();
          }
          if (data.invoiceStatus === "PAID") {
            navigate("/subscription", {
              state: {
                successMessage: isRenewal
                  ? "Payment successful. Your membership has been renewed."
                  : "Payment successful. Your membership is now active.",
              },
            });
          }
        })
        .catch((err) => {
          const { message } = getApiErrorInfo(err);
          setLoadError(message ?? "Unable to load payment information.");
          stopPolling();
        })
        .finally(() => setIsLoading(false));
    };

    fetchStatus();
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return stopPolling;
  }, [id, isRenewal, navigate]);

  useEffect(() => {
    if (!payment || payment.invoiceStatus !== "PENDING") {
      return;
    }

    const expiry = new Date(payment.expiresAt).getTime();
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.round((expiry - Date.now()) / 1000)));
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [payment]);

  const isExpired = payment?.invoiceStatus === "FAILED" || secondsLeft === 0;

  const handleCopy = (text: string, field: "content" | "account") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
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
        ) : payment && isExpired ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-error/30 bg-error-container p-6 text-center">
            <AlertTriangle size={28} className="text-on-error-container" />
            <p className="text-body-md font-semibold text-on-error-container">
              Payment failed or expired.
            </p>
            <p className="text-label-sm text-on-error-container">
              Please go back and try registering or renewing again.
            </p>
            <button
              type="button"
              onClick={() => navigate("/subscription")}
              className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90"
            >
              Back to My Subscriptions
            </button>
          </div>
        ) : payment ? (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <div className="flex items-center justify-center gap-2 border-b border-outline-variant pb-4">
              <QrCode size={18} className="text-primary" />
              <h2 className="font-heading text-body-lg font-bold text-on-surface">
                {payment.planName}
              </h2>
            </div>

            <div className="mt-3 flex items-center justify-between text-label-sm">
              <span className="text-on-surface-variant">Customer</span>
              <span className="text-on-surface-variant">{payment.customerName}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-label-sm">
              <span className="text-on-surface-variant">Vehicle</span>
              <span className="text-on-surface-variant">{payment.vehicleLicensePlate}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-label-sm">
              <span className="text-on-surface-variant">Plan period</span>
              <span className="text-on-surface-variant">
                {formatDate(payment.startDate)} - {formatDate(payment.endDate)} (
                {payment.durationDays} days)
              </span>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="rounded-xl border border-outline-variant bg-white p-3">
                <img
                  src={payment.qrImageUrl ?? undefined}
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
                {formatCurrency(payment.amount)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-label-sm">
              <span className="text-on-surface-variant">Expires in</span>
              <span className="text-on-surface-variant">
                {secondsLeft !== null
                  ? formatCountdown(secondsLeft)
                  : formatDateTime(payment.expiresAt)}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container p-3">
              <div className="flex items-center justify-between text-label-sm">
                <span className="text-on-surface-variant">Bank</span>
                <span className="font-semibold text-on-surface">{payment.bankCode}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">
                  Account number
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(payment.bankAccountNumber, "account")}
                  className="flex items-center gap-1 text-label-sm font-semibold text-primary"
                >
                  {copiedField === "account" ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 break-words font-mono text-body-md font-semibold text-on-surface">
                {payment.bankAccountNumber}
              </p>

              <div className="mt-2 flex items-center justify-between text-label-sm">
                <span className="text-on-surface-variant">Account name</span>
                <span className="font-semibold text-on-surface">
                  {payment.bankAccountName}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-3">
                <span className="text-label-sm text-on-surface-variant">
                  Transfer content
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(payment.transferContent, "content")}
                  className="flex items-center gap-1 text-label-sm font-semibold text-primary"
                >
                  {copiedField === "content" ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 break-words font-mono text-body-md font-semibold text-on-surface">
                {payment.transferContent}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-label-sm text-on-surface-variant">
              <Loader2 size={14} className="animate-spin" />
              Waiting for payment confirmation...
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

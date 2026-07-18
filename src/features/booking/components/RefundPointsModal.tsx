import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { formatCurrency } from "../../../utils";
import { getTierStyle } from "../../../constants/tierStyles";
import { createRefund, getRefundPointsPreview } from "../api/refundApi";
import type { RefundPointsPreview } from "../types/refund";
import type { BookingCard } from "../types/booking";

// Map errorCode từ BE → thông báo lỗi hiển thị cho user (giống RefundModal)
const API_ERROR_MAP: Record<string, string> = {
  BOOKING_NOT_CANCELABLE:
    "This booking can no longer be canceled (less than 2 hours before the appointment).",
  REFUND_ALREADY_EXISTS: "A refund request already exists for this booking.",
};

interface RefundPointsModalProps {
  booking: BookingCard;
  onBack: () => void;
  onClose: () => void;
  /** Called after a refund request is created — parent removes the booking card. */
  onRefunded: (bookingId: number) => void;
}

const RefundPointsModal = ({
  booking,
  onBack,
  onClose,
  onRefunded,
}: RefundPointsModalProps) => {
  const [preview, setPreview] = useState<RefundPointsPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setIsLoadingPreview(true);
    getRefundPointsPreview(booking.bookingId)
      .then((data) => alive && setPreview(data))
      .catch(() => {
        if (alive) {
          setPreviewError("Failed to load points preview. Please try again.");
        }
      })
      .finally(() => alive && setIsLoadingPreview(false));
    return () => {
      alive = false;
    };
  }, [booking.bookingId]);

  const handleSubmit = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const res = await createRefund({
        bookingId: booking.bookingId,
        refundMethod: "LOYALTY_POINTS",
      });
      setSuccessMessage(
        `You've been credited ${(res.pointsAwarded ?? preview?.previewPoints ?? 0).toLocaleString()} loyalty points. Your booking has been canceled.`,
      );
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setApiError(
        API_ERROR_MAP[errorCode ?? ""] ??
          message ??
          "Failed to submit refund request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      variant="custom"
    >
      {/* Success feedback → then remove card */}
      <Modal
        isOpen={!!successMessage}
        onClose={() => {
          setSuccessMessage(null);
          onRefunded(booking.bookingId);
          onClose();
        }}
        variant="success"
        title="Points credited"
        message={successMessage ?? ""}
        confirmText="Got it"
      />

      {/* Error feedback */}
      <Modal
        isOpen={!!apiError}
        onClose={() => setApiError(null)}
        variant="danger"
        title="Unable to process refund"
        message={apiError ?? ""}
        confirmText="Got it"
        onConfirm={() => setApiError(null)}
      />

      <div className="flex w-full flex-col gap-5 text-left">
        {/* Header */}
        <div>
          <h2 className="text-headline-md font-semibold text-on-surface">
            Convert to loyalty points
          </h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Your deposit will be credited instantly as loyalty points instead
            of a bank transfer.
          </p>
        </div>

        {isLoadingPreview ? (
          <div className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-4 py-8">
            <Loader2 className="size-5 animate-spin text-on-surface-variant" />
          </div>
        ) : previewError || !preview ? (
          <p className="text-body-sm text-error">
            {previewError ?? "Failed to load points preview."}
          </p>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Deposit amount</span>
              <span className="font-semibold text-on-surface">
                {formatCurrency(preview.depositAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Your tier</span>
              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${getTierStyle(preview.tierName).badge}`}
              >
                {preview.tierName}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">
                Points multiplier
              </span>
              <span className="font-semibold text-on-surface">
                x{preview.pointMultiple}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
              <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                <Star className="size-4 text-tertiary-container" />
                You'll receive
              </span>
              <span className="text-headline-sm font-bold text-tertiary-container">
                +{preview.previewPoints.toLocaleString()} pts
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-outline-variant px-5 py-2.5 text-body-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-60"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingPreview || !preview}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RefundPointsModal;

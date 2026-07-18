import { useState } from "react";
import { ChevronRight, Landmark, Star } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import RefundModal from "./RefundModal";
import RefundPointsModal from "./RefundPointsModal";
import type { BookingCard } from "../types/booking";

type Step = "choose" | "bank" | "points";

interface CancelBookingModalProps {
  booking: BookingCard;
  onClose: () => void;
  /** Called after a refund request is created — parent removes the booking card. */
  onRefunded: (bookingId: number) => void;
}

export default function CancelBookingModal({
  booking,
  onClose,
  onRefunded,
}: CancelBookingModalProps) {
  const [step, setStep] = useState<Step>("choose");

  if (step === "bank") {
    return (
      <RefundModal booking={booking} onClose={onClose} onRefunded={onRefunded} />
    );
  }

  if (step === "points") {
    return (
      <RefundPointsModal
        booking={booking}
        onBack={() => setStep("choose")}
        onClose={onClose}
        onRefunded={onRefunded}
      />
    );
  }

  return (
    <Modal isOpen onClose={onClose} variant="custom">
      <div className="flex w-full flex-col gap-5 text-left">
        <div>
          <h2 className="text-headline-md font-semibold text-on-surface">
            Cancel booking
          </h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Choose how you'd like to receive your deposit refund.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStep("bank")}
          className="flex items-center gap-4 rounded-lg border border-outline-variant px-4 py-4 text-left transition-colors hover:bg-surface-container-high"
        >
          <Landmark className="size-6 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-on-surface">
              Refund to bank account
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Receive your deposit via bank transfer within 1–3 business days.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-on-surface-variant" />
        </button>

        <button
          type="button"
          onClick={() => setStep("points")}
          className="flex items-center gap-4 rounded-lg border border-outline-variant px-4 py-4 text-left transition-colors hover:bg-surface-container-high"
        >
          <Star className="size-6 shrink-0 text-tertiary-container" />
          <div className="flex-1">
            <p className="font-semibold text-on-surface">
              Convert to loyalty points
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Get your deposit credited instantly as loyalty points.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-on-surface-variant" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-body-sm font-semibold text-on-surface-variant hover:underline"
        >
          Keep Booking
        </button>
      </div>
    </Modal>
  );
}

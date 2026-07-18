import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { Calendar, Car, ChevronRight, CirclePlus } from "lucide-react";
import { getPastBookings, getUpcomingBookings } from "../api/bookingApi";
import type { BookingCard } from "../types/booking";
import BookingStatusBadge from "../../../components/ui/BookingStatusBadge";
import CancelBookingModal from "../components/CancelBookingModal";
import {
  formatAppointmentDate,
  formatRefundedAt,
  formatTimeRange,
  getEffectiveBookingStatus,
  maskAccount,
} from "../utils/bookingFormatters";
import { formatCurrency } from "../../../utils";
import Modal from "../../../components/ui/Modal";

function BookingCardItem({
  booking,
  onCancelled,
}: {
  booking: BookingCard;
  onCancelled: (bookingId: number) => void;
}) {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);

  function handleCancel() {
    setShowCancelModal(true);
  }
  return (
    <div className="flex flex-col rounded-[8px] border border-outline-variant/50 bg-white shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)]">
      <div className="flex flex-col gap-8 p-8">
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-[8px] border border-primary/10 bg-primary/5">
              <Calendar className="size-6 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-xl font-semibold text-on-surface">
                {booking.serviceName}
              </h3>
              <div className="flex items-center gap-2">
                <Car className="size-3.5 text-on-surface-variant" />
                <span className="text-sm text-on-surface-variant">
                  {booking.brandName} • {booking.color} • {booking.licensePlate}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <BookingStatusBadge status={getEffectiveBookingStatus(booking)} />
            {getEffectiveBookingStatus(booking) === "REFUND_PENDING" && (
              <span className="text-xs font-medium text-amber-600">
                Refund in progress — expected within 1-2 business days
              </span>
            )}
            {getEffectiveBookingStatus(booking) === "REFUNDED" && (
              <span className="text-xs font-medium text-[#22c55e]">
                {booking.refundAmount != null &&
                booking.refundAccountNumber &&
                booking.refundedAt
                  ? `Refunded ${formatCurrency(booking.refundAmount)} to account ${maskAccount(
                      booking.refundAccountNumber,
                    )} at ${formatRefundedAt(booking.refundedAt)}`
                  : "—"}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-outline-variant/20 pt-[33px]">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
              Date
            </span>
            <span className="text-lg font-semibold text-on-surface">
              {formatAppointmentDate(booking.appointmentDate)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
              Time
            </span>
            <span className="text-lg font-semibold text-on-surface">
              {booking.startTime && booking.endTime
                ? formatTimeRange(booking.startTime, booking.endTime)
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {booking.allowedActions.length > 0 && (
        <div className="flex items-center justify-end rounded-b-[8px] border-t border-outline-variant/20 bg-surface-container-low/30 px-6 py-4">
          <div className="flex items-center gap-8">
            {booking.allowedActions.includes("CANCEL") && (
              <button
                onClick={handleCancel}
                className="text-sm font-medium tracking-[0.14px] text-error"
              >
                CANCEL
              </button>
            )}
            {booking.allowedActions.includes("VIEW_DETAILS") && (
              <button
                onClick={() =>
                  navigate(`/booking/history/${booking.bookingId}`)
                }
                className="flex items-center gap-2 text-sm font-bold tracking-[0.14px] text-primary"
              >
                VIEW DETAILS
                <ChevronRight className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {showCancelModal && (
        <CancelBookingModal
          booking={booking}
          onClose={() => setShowCancelModal(false)}
          onRefunded={onCancelled}
        />
      )}
    </div>
  );
}

export default function BookingHistory() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ??
      null,
  );

  // Xóa message khỏi history state sau khi đã hiển thị, tránh F5 hiện lại
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự ẩn popup thành công sau 3s
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!user?.userId) return;

    let isMounted = true;
    const fetchBookings =
      activeTab === "upcoming" ? getUpcomingBookings : getPastBookings;

    fetchBookings(user.userId)
      .then((data) => {
        if (isMounted) setBookings(data);
      })
      .catch(() => {
        if (isMounted)
          setError("Không thể tải danh sách lịch đặt. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, user?.userId]);

  /** Switches tab and resets list state so the new tab shows its own loading spinner. */
  function handleTabChange(tab: "upcoming" | "past") {
    setActiveTab(tab);
    setIsLoading(true);
    setError(null);
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* Thông báo đặt lịch + đặt cọc thành công, từ BookingPayment.tsx */}
      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        variant="success"
        title="Success"
        message={successMessage}
      />
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Service History &amp; Bookings
          </h1>
        </div>
      </div>

      <div className="flex gap-8 border-b border-outline-variant/30">
        <button
          onClick={() => handleTabChange("upcoming")}
          className={`pb-[26px] text-sm tracking-[0.14px] ${
            activeTab === "upcoming"
              ? "border-b-2 border-primary font-semibold text-primary"
              : "font-medium text-on-surface-variant"
          }`}
        >
          Upcoming Appointments
        </button>
        <button
          onClick={() => handleTabChange("past")}
          className={`pb-[26px] text-sm tracking-[0.14px] ${
            activeTab === "past"
              ? "border-b-2 border-primary font-semibold text-primary"
              : "font-medium text-on-surface-variant"
          }`}
        >
          Past Services
        </button>
      </div>

      {error ? (
        <div className="flex h-48 items-center justify-center text-base text-error">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          Đang tải...
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          {activeTab === "upcoming"
            ? "No upcoming appointments"
            : "No past services available"}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {bookings.map((booking) => (
            <BookingCardItem
              key={booking.bookingId}
              booking={booking}
              onCancelled={(bookingId) =>
                setBookings((prev) =>
                  prev.filter((b) => b.bookingId !== bookingId),
                )
              }
            />
          ))}

          {activeTab === "upcoming" && (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-outline-variant bg-surface-container-low">
              <CirclePlus className="size-10 text-outline" />
              <span className="text-base text-outline">
                Schedule another maintenance session
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Calendar, Car, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { getBookingDetail, cancelBooking } from "../api/bookingApi";
import type { BookingDetail } from "../types/booking";
import BookingStatusBadge from "../../../components/ui/BookingStatusBadge";
import Modal from "../../../components/ui/Modal";
import {
  formatAppointmentDate,
  formatTimeRange,
  formatCurrency,
} from "../utils/bookingFormatters";
import { clearBookingDraft } from "../utils/bookingDraft";

const POLL_INTERVAL_MS = 4000;

// Trạng thái booking BE trả về khi deposit đã được xác nhận (qua webhook SePay
// hoặc manual-confirm) - xem BE `payment.md` / BookingServiceImpl.createBooking
const isDepositConfirmedStatus = (status: string) =>
  status !== "PENDING" && status !== "CANCELED";

export default function BookingPayment() {
  const navigate = useNavigate();
  const { bookingId: bookingIdParam } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const state =
    (location.state as {
      stationId?: number;
      depositAmount?: number;
      transferContent?: string;
      qrImageUrl?: string;
    } | null) ?? null;

  const bookingId = Number(bookingIdParam);
  const stationId = state?.stationId ?? null;

  const [depositAmount] = useState<number | null>(
    state?.depositAmount ?? null,
  );
  const [transferContent] = useState<string | null>(
    state?.transferContent ?? null,
  );
  const [qrImageUrl] = useState<string | null>(state?.qrImageUrl ?? null);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Gọi ngầm, dùng cho cả polling tự động lẫn nút bấm thủ công - không set isChecking
  // ở đây để tránh set state đồng bộ ngay trong effect (react-hooks/set-state-in-effect)
  const checkStatusSilently = async () => {
    if (!bookingId) return;
    try {
      const detail = await getBookingDetail(bookingId);
      setBooking(detail);
      if (detail.isDepositPaid || isDepositConfirmedStatus(detail.status)) {
        setIsConfirmed(true);
        stopPolling();
      }
      setCheckError(null);
    } catch {
      setCheckError("Unable to check payment status. Please try again.");
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    await checkStatusSilently();
    setIsChecking(false);
  };

  // Tải chi tiết booking lần đầu để hiển thị summary (service/vehicle/schedule/price)
  useEffect(() => {
    if (!bookingId) return;
    let isMounted = true;
    getBookingDetail(bookingId)
      .then((detail) => {
        if (!isMounted) return;
        setBooking(detail);
        if (detail.isDepositPaid || isDepositConfirmedStatus(detail.status)) {
          setIsConfirmed(true);
        }
      })
      .catch(() => {
        if (isMounted)
          setDetailError("Failed to load booking details. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    intervalRef.current = setInterval(checkStatusSilently, POLL_INTERVAL_MS);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Cọc được xác nhận -> tự động về Home kèm thông báo (dùng lại field
  // bookingSuccessMessage mà Home.tsx đã đọc sẵn qua location.state)
  useEffect(() => {
    if (!isConfirmed) return;
    if (stationId) clearBookingDraft(stationId);
    navigate("/", {
      state: {
        bookingSuccessMessage: `Booking confirmed! Booking ID: ${bookingId}.`,
      },
    });
  }, [isConfirmed, bookingId, stationId, navigate]);

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    setIsCanceling(true);
    setCancelError(null);
    try {
      await cancelBooking(bookingId);
      stopPolling();
      navigate("/booking/location");
    } catch {
      setCancelError("Failed to cancel booking. Please try again.");
    } finally {
      setIsCanceling(false);
    }
  };

  if (!bookingId) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-container-max px-4 py-16 text-center md:px-12">
          <p className="text-body-lg text-error">Booking not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-container-max px-4 py-10 md:px-12">
        {isConfirmed ? (
          <div className="mx-auto max-w-[480px] rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 size={32} className="text-primary" />
            </span>
            <h1 className="mt-4 font-headline text-headline-lg text-on-surface">
              Payment Confirmed
            </h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Booking #{bookingId} deposit has been received. Redirecting…
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 pb-16 lg:grid-cols-[1fr_360px]">
            {/* ===== CỘT TRÁI: Booking summary ===== */}
            <div className="flex flex-col gap-6">
              <h1 className="font-headline text-headline-lg text-on-surface md:text-headline-xl">
                Complete Your Deposit
              </h1>

              {isLoadingDetail ? (
                <p className="text-body-md text-on-surface-variant">
                  Loading booking details...
                </p>
              ) : detailError || !booking ? (
                <p className="text-body-md text-error">
                  {detailError ?? "Booking details not found."}
                </p>
              ) : (
                <>
                  <div className="flex flex-col rounded-[8px] border border-outline-variant/50 bg-white shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)]">
                    <div className="flex flex-col gap-6 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-[8px] border border-primary/10 bg-primary/5">
                            <Calendar className="size-5 text-primary" />
                          </span>
                          <div className="flex flex-col gap-1">
                            <h3 className="font-heading text-lg font-semibold text-on-surface">
                              {booking.serviceName}
                            </h3>
                            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                              <Car className="size-3.5" />
                              <span>
                                {booking.brandName} • {booking.color} •{" "}
                                {booking.licensePlate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <BookingStatusBadge status={booking.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-6 border-t border-outline-variant/20 pt-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                            Date
                          </span>
                          <span className="text-body-md font-semibold text-on-surface">
                            {formatAppointmentDate(booking.appointmentDate)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                            Time
                          </span>
                          <span className="text-body-md font-semibold text-on-surface">
                            {booking.startTime && booking.endTime
                              ? formatTimeRange(
                                  booking.startTime,
                                  booking.endTime,
                                )
                              : "—"}
                          </span>
                        </div>
                        {booking.stationName && (
                          <div className="col-span-2 flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                              Station
                            </span>
                            <span className="flex items-center gap-2 text-body-md font-semibold text-on-surface">
                              <MapPin className="size-4 text-on-surface-variant" />
                              {booking.stationName}
                            </span>
                            {booking.stationAddress && (
                              <span className="text-body-sm text-on-surface-variant">
                                {booking.stationAddress}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col rounded-[8px] border border-outline-variant/50 bg-white shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)]">
                    <div className="flex flex-col gap-3 p-6">
                      <h3 className="font-heading text-body-lg font-semibold text-on-surface">
                        Price Breakdown
                      </h3>

                      <div className="flex items-center justify-between text-body-md">
                        <span className="text-on-surface-variant">
                          {booking.serviceName}
                        </span>
                        <span className="font-semibold text-on-surface">
                          {formatCurrency(booking.servicePrice)}
                        </span>
                      </div>

                      {booking.addons.map((addon, index) => (
                        <div
                          key={`${addon.addonName}-${index}`}
                          className="flex items-center justify-between text-body-md"
                        >
                          <span className="text-on-surface-variant">
                            {addon.addonName}
                          </span>
                          <span className="font-semibold text-on-surface">
                            {formatCurrency(addon.addonPrice)}
                          </span>
                        </div>
                      ))}

                      {booking.voucherDiscountAmount > 0 && (
                        <div className="flex items-center justify-between text-body-md">
                          <span className="text-on-surface-variant">
                            Voucher
                            {booking.voucherCode
                              ? ` (${booking.voucherCode}${
                                  booking.voucherDiscountPercent
                                    ? ` -${booking.voucherDiscountPercent}%`
                                    : ""
                                })`
                              : ""}
                          </span>
                          <span className="font-semibold text-error">
                            -{formatCurrency(booking.voucherDiscountAmount)}
                          </span>
                        </div>
                      )}

                      {booking.discountAmount > 0 && (
                        <div className="flex items-center justify-between text-body-md">
                          <span className="text-on-surface-variant">
                            Discount
                          </span>
                          <span className="font-semibold text-error">
                            -{formatCurrency(booking.discountAmount)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3 text-body-lg">
                        <span className="font-semibold text-on-surface">
                          Total
                        </span>
                        <span className="font-bold text-on-surface">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-body-md">
                        <span className="text-on-surface-variant">
                          Remaining (pay at station)
                        </span>
                        <span className="font-semibold text-on-surface">
                          {formatCurrency(booking.remainingAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-fit rounded-lg border border-error px-6 py-3 text-body-md font-semibold text-error transition-colors hover:bg-error/5"
                  >
                    Cancel Booking
                  </button>
                </>
              )}
            </div>

            {/* ===== CỘT PHẢI: QR thanh toán cọc ===== */}
            <aside className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] lg:sticky lg:top-24">
              <div className="pb-4 text-center">
                <p className="text-body-md text-on-surface-variant">
                  Scan the QR code below to transfer the deposit and confirm
                  your booking.
                </p>
              </div>

              <div className="flex justify-center pb-6">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="VietQR bank transfer QR code"
                    className="h-56 w-56 rounded-xl border border-outline-variant object-contain"
                  />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-outline-variant text-body-md text-on-surface-variant">
                    QR code unavailable
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-4">
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-on-surface-variant">
                    Deposit Amount
                  </span>
                  <span className="text-body-lg font-semibold text-primary">
                    {formatCurrency(depositAmount ?? 0)}
                  </span>
                </div>
                {transferContent && (
                  <div className="flex items-center justify-between">
                    <span className="text-body-md text-on-surface-variant">
                      Transfer Content
                    </span>
                    <span className="text-body-md font-semibold text-on-surface">
                      {transferContent}
                    </span>
                  </div>
                )}
              </div>

              {checkError && (
                <p className="mt-4 text-center text-body-md text-error">
                  {checkError}
                </p>
              )}

              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="flex items-center gap-2 text-body-md text-on-surface-variant">
                  <Loader2 size={16} className="animate-spin" />
                  Waiting for payment confirmation...
                </p>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="w-full rounded-lg border border-primary px-6 py-3 text-body-md font-semibold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isChecking ? "Checking..." : "I've completed the transfer"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          if (isCanceling) return;
          setIsCancelModalOpen(false);
          setCancelError(null);
        }}
        variant="danger"
        title="Cancel this booking?"
        message={
          cancelError ?? "This cannot be undone. Your slot will be released."
        }
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        onConfirm={handleCancelBooking}
        isConfirmLoading={isCanceling}
      />
    </main>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Car, ChevronRight, MapPin, User } from "lucide-react";
import { getBookingDetail } from "../api/bookingApi";
import type { BookingDetail as BookingDetailData } from "../types/booking";
import { STATUS_STYLES } from "../constants/statusStyles";
import { formatAppointmentDate, formatCurrency, formatTimeRange } from "../utils/bookingFormatters";
import { BookingPageHeader } from "../components/BookingPageHeader";
import { BookingPageFooter } from "../components/BookingPageFooter";

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getBookingDetail(Number(bookingId))
      .then((data) => {
        if (isMounted) setBooking(data);
      })
      .catch(() => {
        if (isMounted) setError("Không thể tải thông tin booking. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const statusStyle = booking ? STATUS_STYLES[booking.status] : null;

  return (
    <div className="min-h-screen bg-white">
      <BookingPageHeader />

      <main className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-outline">Profile</span>
            <ChevronRight className="size-3 text-outline" />
            <button
              onClick={() => navigate("/booking/history")}
              className="text-xs font-semibold text-outline hover:text-on-surface-variant"
            >
              My Booking
            </button>
            <ChevronRight className="size-3 text-outline" />
            <span className="text-xs font-semibold text-on-surface-variant">Booking Detail</span>
          </div>
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Booking Detail
          </h1>
        </div>

        {error ? (
          <div className="flex h-48 items-center justify-center text-base text-error">{error}</div>
        ) : isLoading || !booking || !statusStyle ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            Đang tải...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
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
                  <div
                    className={`flex shrink-0 items-center gap-2 rounded-md border px-[17px] py-[7px] ${statusStyle.bgClassName} ${statusStyle.borderClassName}`}
                  >
                    <span className={`size-2 rounded-full ${statusStyle.dotClassName}`} />
                    <span
                      className={`text-xs font-bold uppercase tracking-[0.6px] ${statusStyle.textClassName}`}
                    >
                      {statusStyle.label}
                    </span>
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
                  {booking.stationName && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                        Station
                      </span>
                      <span className="flex items-center gap-2 text-lg font-semibold text-on-surface">
                        <MapPin className="size-4 text-on-surface-variant" />
                        {booking.stationName}
                      </span>
                      {booking.stationAddress && (
                        <span className="text-sm text-on-surface-variant">{booking.stationAddress}</span>
                      )}
                    </div>
                  )}
                  {booking.technicianName && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                        Technician
                      </span>
                      <span className="flex items-center gap-2 text-lg font-semibold text-on-surface">
                        <User className="size-4 text-on-surface-variant" />
                        {booking.technicianName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-[8px] border border-outline-variant/50 bg-white shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)]">
              <div className="flex flex-col gap-4 p-8">
                <h3 className="font-heading text-lg font-semibold text-on-surface">Price Breakdown</h3>

                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 text-sm">
                  <span className="text-on-surface-variant">{booking.serviceName}</span>
                  <span className="font-semibold text-on-surface">{formatCurrency(booking.servicePrice)}</span>
                </div>

                {booking.addons.map((addon, index) => (
                  <div key={`${addon.addonName}-${index}`} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{addon.addonName}</span>
                    <span className="font-semibold text-on-surface">{formatCurrency(addon.addonPrice)}</span>
                  </div>
                ))}

                {booking.voucherCode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Voucher ({booking.voucherCode}
                      {booking.voucherDiscountPercent ? ` -${booking.voucherDiscountPercent}%` : ""})
                    </span>
                    <span className="font-semibold text-error">
                      -{formatCurrency(booking.voucherDiscountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 text-base">
                  <span className="font-semibold text-on-surface">Total</span>
                  <span className="font-bold text-on-surface">{formatCurrency(booking.totalAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Deposit {booking.isDepositPaid ? "(paid)" : "(unpaid)"}
                  </span>
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(booking.depositAmount ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Remaining</span>
                  <span className="font-semibold text-on-surface">{formatCurrency(booking.remainingAmount)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/booking/history")}
              className="flex items-center gap-2 self-start text-sm font-bold tracking-[0.14px] text-primary"
            >
              <ArrowLeft className="size-3.5" />
              Back to My Bookings
            </button>
          </div>
        )}
      </main>

      <BookingPageFooter />
    </div>
  );
}

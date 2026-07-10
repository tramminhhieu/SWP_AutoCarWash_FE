import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Car,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { getBookingDetail } from "../api/bookingApi";
import type { BookingDetail as BookingDetailData } from "../types/booking";
import BookingStatusBadge from "../../../components/ui/BookingStatusBadge";
import {
  formatAppointmentDate,
  formatCheckInTime,
  formatCurrency,
  formatTimeRange,
} from "../utils/bookingFormatters";

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = () => {
      setIsLoading(true);
      setError(null);

      getBookingDetail(Number(bookingId))
        .then((data) => {
          if (isMounted) setBooking(data);
        })
        .catch(() => {
          if (isMounted)
            setError("Failed to load booking details. Please try again.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
          Booking Detail
        </h1>
      </div>

      {error ? (
        <div className="flex h-48 items-center justify-center text-base text-error">
          {error}
        </div>
      ) : isLoading || !booking ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          Loading...
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
                        {booking.brandName} • {booking.color} •{" "}
                        {booking.licensePlate}
                      </span>
                    </div>
                  </div>
                </div>
                <BookingStatusBadge status={booking.status} />
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
                      <span className="text-sm text-on-surface-variant">
                        {booking.stationAddress}
                      </span>
                    )}
                  </div>
                )}
                {booking.technicianName && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                      Checked In By
                    </span>
                    <span className="flex items-center gap-2 text-lg font-semibold text-on-surface">
                      <User className="size-4 text-on-surface-variant" />
                      {booking.technicianName}
                    </span>
                  </div>
                )}
                {booking.checkInAt && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                      Checked In At
                    </span>
                    <span className="flex items-center gap-2 text-lg font-semibold text-on-surface">
                      <Clock className="size-4 text-on-surface-variant" />
                      {formatCheckInTime(booking.checkInAt)}
                    </span>
                  </div>
                )}
                {booking.checkOutAt && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                      Checked Out At
                    </span>
                    <span className="flex items-center gap-2 text-lg font-semibold text-on-surface">
                      <Clock className="size-4 text-on-surface-variant" />
                      {formatCheckInTime(booking.checkOutAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-[8px] border border-outline-variant/50 bg-white shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)]">
            <div className="flex flex-col gap-6 p-8">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold text-on-surface">
                  Price Breakdown
                </h3>
                {booking.customerTier && (
                  <span className="rounded-[6px] border border-primary/10 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">
                    {booking.customerTier}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-4">
                <div className="flex items-center justify-between text-sm">
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
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-on-surface-variant">
                      {addon.addonName}
                    </span>
                    <span className="font-semibold text-on-surface">
                      {formatCurrency(addon.addonPrice)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Voucher{booking.voucherCode ? ` (${booking.voucherCode}${booking.voucherDiscountPercent ? ` -${booking.voucherDiscountPercent}%` : ""})` : ""}
                  </span>
                  <span className="font-semibold text-error">
                    -{formatCurrency(booking.voucherDiscountAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Point Discount</span>
                  <span className="font-semibold text-error">-{formatCurrency(booking.pointDiscountAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Discount</span>
                  <span className="font-semibold text-error">-{formatCurrency(booking.discountAmount)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-4">
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold text-on-surface">Total</span>
                  <span className="font-bold text-on-surface">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Deposit {booking.isDepositPaid ? "(paid)" : "(unpaid)"}
                  </span>
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(booking.depositAmount ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-bold text-on-surface">Remaining</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(booking.remainingAmount)}
                  </span>
                </div>
              </div>

              {(booking.pointsEarned != null ||
                booking.pointsRedeemed != null ||
                booking.loyaltyPoint != null) && (
                <div className="flex items-center justify-between rounded-[8px] bg-primary/5 p-4">
                  <span className="text-sm text-on-surface-variant">
                    {booking.pointsEarned != null &&
                      `+${booking.pointsEarned.toLocaleString()} earned`}
                    {booking.pointsEarned != null &&
                      booking.pointsRedeemed != null &&
                      " · "}
                    {booking.pointsRedeemed != null &&
                      `-${booking.pointsRedeemed.toLocaleString()} redeemed`}
                  </span>
                  {booking.loyaltyPoint != null && (
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">
                        Loyalty Points
                      </p>
                      <p className="text-lg font-bold text-on-surface">
                        {booking.loyaltyPoint.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

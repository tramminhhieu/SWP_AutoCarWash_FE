import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  Calendar,
  CalendarPlus,
  Car,
  ChevronRight,
  CirclePlus,
  Star,
} from "lucide-react";
import { getPastBookings, getUpcomingBookings } from "../api/bookingApi";
import type { BookingCard } from "../types/booking";
import { STATUS_STYLES } from "../constants/statusStyles";
import {
  formatAppointmentDate,
  formatTimeRange,
} from "../utils/bookingFormatters";

/** Renders a single booking as a card, matching the Figma "Active Booking Card" layout. */
function BookingCardItem({ booking }: { booking: BookingCard }) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[booking.status];

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
          <div
            className={`flex shrink-0 items-center gap-2 rounded-md border px-[17px] py-[7px] ${statusStyle.bgClassName} ${statusStyle.borderClassName}`}
          >
            <span
              className={`size-2 rounded-full ${statusStyle.dotClassName}`}
            />
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
              {formatTimeRange(booking.startTime, booking.endTime)}
            </span>
          </div>
        </div>
      </div>

      {booking.allowedActions.length > 0 && (
        <div className="flex items-center justify-end rounded-b-[8px] border-t border-outline-variant/20 bg-surface-container-low/30 px-6 py-4">
          <div className="flex items-center gap-8">
            {booking.allowedActions.includes("CANCEL") && (
              <button className="text-sm font-medium tracking-[0.14px] text-error">
                CANCEL
              </button>
            )}
            {booking.allowedActions.includes("WRITE_REVIEW") && (
              <button className="flex items-center gap-2 text-sm font-bold tracking-[0.14px] text-primary">
                WRITE A REVIEW
                <Star className="size-3.5" />
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
    </div>
  );
}

export default function BookingHistory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) {
      setIsLoading(false);
      return;
    }

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
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-outline">Profile</span>
            <ChevronRight className="size-3 text-outline" />
            <span className="text-xs font-semibold text-on-surface-variant">
              My Booking
            </span>
          </div>
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Service History &amp; Bookings
          </h1>
        </div>
        <button className="flex items-center gap-2 rounded-[8px] border border-outline-variant/30 bg-surface-container-high px-[25px] py-[17px]">
          <CalendarPlus className="size-5 text-on-surface" />
          <span className="text-sm font-bold tracking-[0.14px] text-on-surface">
            Book New Service
          </span>
        </button>
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
            ? "Không có lịch hẹn sắp tới."
            : "Chưa có lịch sử dịch vụ nào."}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {bookings.map((booking) => (
            <BookingCardItem key={booking.bookingId} booking={booking} />
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

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  CalendarPlus,
  Car,
  ChevronRight,
  CircleUserRound,
  CirclePlus,
  Globe,
  Share2,
  Star,
} from "lucide-react";
import { getPastBookings, getUpcomingBookings } from "../api/bookingApi";
import type { BookingCard, BookingStatus } from "../types/booking";

/**
 * Temporary hard-coded customer id used to query the backend.
 *
 * The project does not have a working login/auth flow yet (`AuthContext` is
 * still a stub), so there is no logged-in user to read an id from. Replace
 * this with the authenticated customer's id once auth is implemented.
 */
const CUSTOMER_ID = 1;

const FOOTER_LINKS = {
  Support: ["FAQ", "Contact Us"],
  Company: ["Privacy Policy", "Terms of Service"],
};

/** Visual style for a given {@link BookingStatus}, used by the status pill. */
interface StatusStyle {
  /** Text shown inside the pill. */
  label: string;
  /** Tailwind classes for the small status dot. */
  dotClassName: string;
  /** Tailwind classes for the label text. */
  textClassName: string;
  /** Tailwind classes for the pill background. */
  bgClassName: string;
  /** Tailwind classes for the pill border. */
  borderClassName: string;
}

/** Maps every {@link BookingStatus} to the pill style it should render with. */
const STATUS_STYLES: Record<BookingStatus, StatusStyle> = {
  CONFIRMED: {
    label: "CONFIRMED",
    dotClassName: "bg-[#22c55e]",
    textClassName: "text-[#22c55e]",
    bgClassName: "bg-tertiary-fixed/20",
    borderClassName: "border-tertiary/10",
  },
  PAID: {
    label: "COMPLETED",
    dotClassName: "bg-[#22c55e]",
    textClassName: "text-[#22c55e]",
    bgClassName: "bg-tertiary-fixed/20",
    borderClassName: "border-tertiary/10",
  },
  CHECKED_IN: {
    label: "CHECKED IN",
    dotClassName: "bg-primary",
    textClassName: "text-primary",
    bgClassName: "bg-primary/10",
    borderClassName: "border-primary/10",
  },
  WASHING: {
    label: "IN PROGRESS",
    dotClassName: "bg-primary",
    textClassName: "text-primary",
    bgClassName: "bg-primary/10",
    borderClassName: "border-primary/10",
  },
  CANCELLED: {
    label: "CANCELLED",
    dotClassName: "bg-error",
    textClassName: "text-error",
    bgClassName: "bg-error-container",
    borderClassName: "border-error/10",
  },
  NO_SHOW: {
    label: "NO SHOW",
    dotClassName: "bg-error",
    textClassName: "text-error",
    bgClassName: "bg-error-container",
    borderClassName: "border-error/10",
  },
};

/**
 * Formats a backend `yyyy-MM-dd` date string into the long display form
 * used on the card, e.g. `"2023-10-18"` -> `"October 18, 2023"`.
 */
function formatAppointmentDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Formats a backend `HH:mm:ss` time string into a 12-hour clock time,
 * e.g. `"09:30:00"` -> `"09:30 AM"`.
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formats a backend start/end time pair into the display range used on the
 * card, e.g. `"09:30:00"`/`"09:45:00"` -> `"09:30 AM - 09:45 AM"`.
 */
function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/** Renders a single booking as a card, matching the Figma "Active Booking Card" layout. */
function BookingCardItem({ booking }: { booking: BookingCard }) {
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
              {formatTimeRange(booking.startTime, booking.endTime)}
            </span>
          </div>
        </div>
      </div>

      {booking.allowedActions.length > 0 && (
        <div className="flex items-center justify-end rounded-b-[8px] border-t border-outline-variant/20 bg-surface-container-low/30 px-6 py-4">
          <div className="flex items-center gap-8">
            {booking.allowedActions.includes("CANCEL") && (
              <button className="text-sm font-medium tracking-[0.14px] text-error">CANCEL</button>
            )}
            {booking.allowedActions.includes("WRITE_REVIEW") && (
              <button className="flex items-center gap-2 text-sm font-bold tracking-[0.14px] text-primary">
                WRITE A REVIEW
                <Star className="size-3.5" />
              </button>
            )}
            {booking.allowedActions.includes("VIEW_DETAILS") && (
              <button className="flex items-center gap-2 text-sm font-bold tracking-[0.14px] text-primary">
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

function BookingHistoryHeader() {
  return (
    <header className="border-b border-outline-variant/30 bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-12 py-4">
        <span className="font-heading text-2xl font-bold tracking-[-0.6px] text-on-surface">
          HydroLux
        </span>
        <nav className="flex items-center gap-6">
          {["Service", "How It Works", "Family", "Review"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm font-medium tracking-[0.14px] text-on-surface-variant hover:text-on-surface"
            >
              {link}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button aria-label="Notifications" className="text-on-surface-variant hover:text-on-surface">
            <Bell className="size-5" />
          </button>
          <button aria-label="Profile" className="text-on-surface-variant hover:text-on-surface">
            <CircleUserRound className="size-6" />
          </button>

        </div>
      </div>
    </header>
  );
}

function BookingHistoryFooter() {
  return (
    <footer className="border-t border-outline-variant/30 bg-white pt-px">
      <div className="mx-auto flex max-w-[1440px] items-start justify-between px-12 py-8">
        <div className="flex max-w-[320px] flex-col gap-4">
          <span className="font-heading text-xl font-bold text-on-surface">GLOSS &amp; GEAR</span>
          <p className="text-sm text-on-surface-variant">
            Hydro-Industrial grade automotive detailing and protection for the discerning
            enthusiast.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8">
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading} className="flex flex-col gap-2">
              <h5 className="text-sm font-bold tracking-[0.14px] text-on-surface">{heading}</h5>
              {links.map((link) => (
                <a key={link} href="#" className="text-xs font-semibold text-on-surface-variant">
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-outline-variant/10 px-12 py-6">
        <span className="text-xs font-semibold text-on-surface-variant">
          © 2024 HydroLux Automotive. All rights reserved.
        </span>
        <div className="flex items-center gap-6">
          <Globe className="size-5 text-on-surface-variant" />
          <Share2 className="size-[18px] text-on-surface-variant" />
        </div>
      </div>
    </footer>
  );
}

export default function BookingHistory() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBookings = activeTab === "upcoming" ? getUpcomingBookings : getPastBookings;

    fetchBookings(CUSTOMER_ID)
      .then((data) => {
        if (isMounted) setBookings(data);
      })
      .catch(() => {
        if (isMounted) setError("Không thể tải danh sách lịch đặt. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  /** Switches tab and resets list state so the new tab shows its own loading spinner. */
  function handleTabChange(tab: "upcoming" | "past") {
    setActiveTab(tab);
    setIsLoading(true);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-white">
      <BookingHistoryHeader />

      <main className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-outline">Profile</span>
              <ChevronRight className="size-3 text-outline" />
              <span className="text-xs font-semibold text-on-surface-variant">My Booking</span>
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
          <div className="flex h-48 items-center justify-center text-base text-error">{error}</div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            Đang tải...
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            {activeTab === "upcoming" ? "Không có lịch hẹn sắp tới." : "Chưa có lịch sử dịch vụ nào."}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {bookings.map((booking) => (
              <BookingCardItem key={booking.bookingId} booking={booking} />
            ))}

            {activeTab === "upcoming" && (
              <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-outline-variant bg-surface-container-low">
                <CirclePlus className="size-10 text-outline" />
                <span className="text-base text-outline">Schedule another maintenance session</span>
              </div>
            )}
          </div>
        )}
      </main>

      <BookingHistoryFooter />
    </div>
  );
}

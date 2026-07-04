import type { BookingStatus } from "../features/booking/types/booking";

/** Cấu hình style hiển thị cho 1 trạng thái booking, dạng badge pill (dot + label). */
export interface BookingStatusStyle {
  /** Chữ hiển thị trong badge. */
  label: string;
  /** Class Tailwind cho chấm tròn nhỏ bên trong badge. */
  dotClassName: string;
  /** Class Tailwind cho chữ label. */
  textClassName: string;
  /** Class Tailwind cho nền badge. */
  bgClassName: string;
  /** Class Tailwind cho viền badge. */
  borderClassName: string;
}

/**
 * Map từ mỗi {@link BookingStatus} (khớp field `status` của BookingCard/BookingDetail)
 * sang style hiển thị tương ứng. Đặt ở constants/ gốc để DÙNG CHUNG cho mọi feature cần
 * hiển thị badge trạng thái booking (booking, queue, wash, staff...) — không lặp lại
 * if/else màu ở từng component.
 */
export const BOOKING_STATUS_STYLES: Record<BookingStatus, BookingStatusStyle> =
  {
    PENDING: {
      label: "PENDING",
      dotClassName: "bg-amber-500",
      textClassName: "text-amber-600",
      bgClassName: "bg-amber-50",
      borderClassName: "border-amber-200",
    },
    CONFIRMED: {
      label: "CONFIRMED",
      dotClassName: "bg-secondary",
      textClassName: "text-secondary",
      bgClassName: "bg-secondary/10",
      borderClassName: "border-secondary/20",
    },
    PAID: {
      label: "PAID",
      dotClassName: "bg-[#22c55e]",
      textClassName: "text-[#22c55e]",
      bgClassName: "bg-tertiary-fixed/20",
      borderClassName: "border-tertiary/20",
    },
    CHECK_IN: {
      label: "CHECKED IN",
      dotClassName: "bg-primary",
      textClassName: "text-primary",
      bgClassName: "bg-primary/10",
      borderClassName: "border-primary/20",
    },
    WASHING: {
      label: "WASHING",
      dotClassName: "bg-secondary",
      textClassName: "text-secondary",
      bgClassName: "bg-secondary/10",
      borderClassName: "border-secondary/20",
    },
    CANCELED: {
      label: "CANCELED",
      dotClassName: "bg-error",
      textClassName: "text-error",
      bgClassName: "bg-error-container",
      borderClassName: "border-error/20",
    },
    NO_SHOW: {
      label: "NO SHOW",
      dotClassName: "bg-orange-500",
      textClassName: "text-orange-600",
      bgClassName: "bg-orange-50",
      borderClassName: "border-orange-200",
    },
    CHECK_OUT: {
      label: "CHECKED OUT",
      dotClassName: "bg-[#22c55e]",
      textClassName: "text-[#22c55e]",
      bgClassName: "bg-tertiary-fixed/20",
      borderClassName: "border-tertiary/20",
    },
  };

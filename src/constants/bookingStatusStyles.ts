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
      dotClassName: "bg-secondary",
      textClassName: "text-secondary",
      bgClassName: "bg-secondary-fixed/20",
      borderClassName: "border-secondary/10",
    },
    CONFIRMED: {
      label: "CONFIRMED",
      dotClassName: "bg-[#22c55e]",
      textClassName: "text-[#22c55e]",
      bgClassName: "bg-tertiary-fixed/20",
      borderClassName: "border-tertiary/10",
    },
    PAID: {
      label: "PAID",
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
      CHECK_OUT: {
          label: "COMPLETED",
          dotClassName: "bg-[#22c55e]",
          textClassName: "text-[#22c55e]",
          bgClassName: "bg-tertiary-fixed/20",
          borderClassName: "border-tertiary/10",
      }
  };

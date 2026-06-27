import type { BookingStatus } from "../types/booking";

/** Visual style for a given {@link BookingStatus}, used by the status pill. */
export interface StatusStyle {
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
export const STATUS_STYLES: Record<BookingStatus, StatusStyle> = {
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

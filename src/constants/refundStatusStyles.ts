import type { RefundStatus } from "../features/refund/types/refund";

/** Cấu hình style hiển thị cho 1 trạng thái refund, dạng badge pill (dot + label). */
export interface RefundStatusStyle {
  label: string;
  dotClassName: string;
  textClassName: string;
  bgClassName: string;
  borderClassName: string;
}

export const REFUND_STATUS_STYLES: Record<RefundStatus, RefundStatusStyle> = {
  PENDING: {
    label: "Pending",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-600",
    bgClassName: "bg-amber-50",
    borderClassName: "border-amber-200",
  },
  REFUNDED: {
    label: "Refunded",
    dotClassName: "bg-[#22c55e]",
    textClassName: "text-[#22c55e]",
    bgClassName: "bg-tertiary-fixed/20",
    borderClassName: "border-tertiary/20",
  },
};

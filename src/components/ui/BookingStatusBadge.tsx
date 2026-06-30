import {
  BOOKING_STATUS_STYLES,
  type BookingStatusStyle,
} from "../../constants/bookingStatusStyles";
import type { BookingStatus } from "../../features/booking/types/booking";

// Fallback trung tính khi backend trả status chưa khai báo trong map — tránh
// crash cả trang (đọc bgClassName của undefined). Hiển thị nguyên chuỗi status.
const FALLBACK_STATUS_STYLE: Omit<BookingStatusStyle, "label"> = {
  dotClassName: "bg-outline",
  textClassName: "text-on-surface-variant",
  bgClassName: "bg-surface-container-high",
  borderClassName: "border-outline-variant/30",
};

/**
 * Badge trạng thái booking dạng pill (chấm tròn + label), dùng chung mọi feature.
 * Component chỉ lo phần render — màu/label theo từng status lấy từ
 * constants/bookingStatusStyles, không tự định nghĩa màu ở đây.
 */
function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const statusStyle =
    BOOKING_STATUS_STYLES[status] ?? { ...FALLBACK_STATUS_STYLE, label: status };

  return (
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
  );
}

export default BookingStatusBadge;

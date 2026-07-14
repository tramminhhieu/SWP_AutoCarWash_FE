import { REFUND_STATUS_STYLES } from "../../constants/refundStatusStyles";
import type { RefundStatus } from "../../features/refund/types/refund";

/**
 * Badge trạng thái refund dạng pill (chấm tròn + label), dùng chung mọi feature.
 * Component chỉ lo phần render — màu/label theo từng status lấy từ
 * constants/refundStatusStyles, không tự định nghĩa màu ở đây.
 */
function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const statusStyle = REFUND_STATUS_STYLES[status];

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

export default RefundStatusBadge;

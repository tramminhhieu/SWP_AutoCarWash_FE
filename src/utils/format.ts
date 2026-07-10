/**
 * Format số tiền VNĐ theo chuẩn nhóm số Việt Nam (dấu chấm phân cách hàng nghìn).
 * Vd: formatCurrency(1250000) -> "1.250.000 VNĐ"
 *
 * @param amount Số tiền (đơn vị: đồng). Nhận thêm null/undefined để dùng trực tiếp
 *               với field optional (vd booking.depositAmount) mà không cần check ở ngoài.
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "0 VNĐ";
  }

  // VNĐ không chia nhỏ hơn đồng -> luôn bỏ phần thập phân trước khi format.
  // toLocaleString("vi-VN") tự dùng dấu "." để nhóm hàng nghìn theo đúng chuẩn số Việt Nam.
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} VNĐ`;
};

/**
 * Chuyển input về Date object theo LOCAL time, tránh lệch ngày do timezone khi BE
 * trả field kiểu DATE thuần (vd appointment_date: "2026-06-22").
 * new Date("2026-06-22") parse theo UTC nên ở timezone âm có thể bị lùi 1 ngày
 * -> phải tự tách yyyy-mm-dd ra để dựng Date theo local time.
 */
const parseToLocalDate = (value: string | Date): Date | null => {
  if (value instanceof Date) return value;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // Chuỗi timestamp đầy đủ (có giờ, vd created_at) -> Date tự parse đúng theo ISO + timezone.
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Format ngày về dạng dd/mm/yyyy.
 * Vd: formatDate("2026-06-22") -> "22/06/2026"
 *
 * @param value Nhận chuỗi ISO ("yyyy-MM-dd" hoặc "yyyy-MM-ddTHH:mm:ss"), object Date,
 *              hoặc null/undefined (trả về "—" để hiển thị an toàn khi data chưa có).
 */
export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "—";

  const date = parseToLocalDate(value);
  if (!date || Number.isNaN(date.getTime())) return "—";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

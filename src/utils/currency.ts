// author: Ngọc — format số tiền sang VND, dùng chung cho toàn app (Payment, Queue, ...)
export const formatVND = (amount: number): string =>
  amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

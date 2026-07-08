/**
 * Thông báo (alert) hiển thị cho staff ở luồng Queue (check-in, gán làn, huỷ booking).
 * Đặt ở constants/ gốc để dùng chung, tránh lặp lại string rải rác trong QueuePage.tsx.
 * Tất cả message đồng bộ tiếng Anh, khớp với message trả về từ BE (cũng tiếng Anh).
 */
export const QUEUE_MESSAGES = {
  CHECK_IN_FAILED: "Check-in failed, try again",
  ADD_TO_LANE_FAILED: "Add to lane failed, try again",
  CANCEL_SUCCESS: "Canceled successfully",
  CANCEL_FAILED: "Cancel failed, try again",
} as const;

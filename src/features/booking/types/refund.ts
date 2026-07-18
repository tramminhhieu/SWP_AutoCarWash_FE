// ====== US-04: REFUND khi customer hủy booking ======

/** 1 ngân hàng từ BankEnum của backend (GET /api/refunds/banks). */
export interface BankOption {
  bin: string; // vd "970436"
  displayName: string; // vd "Vietcombank"
  shortCode: string; // vd "VCB"
}

/** Kết quả tra cứu tên chủ tài khoản (VietQR Lookup qua proxy BE) — AC2.1. */
export interface AccountLookupResponse {
  bin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

/** Số tiền cọc cố định toàn hệ thống để hiển thị read-only (GET /api/refunds/deposit-amount). */
export interface DepositAmountResponse {
  amount: number;
}

/** Phương thức hoàn tiền khi customer hủy booking. */
export type RefundMethod = "BANK_TRANSFER" | "LOYALTY_POINTS";

/** Xem trước số điểm sẽ được cộng nếu chọn hoàn tiền bằng điểm (GET /api/refunds/points-preview?bookingId=). */
export interface RefundPointsPreview {
  depositAmount: number;
  tierName: string;
  pointMultiple: number;
  previewPoints: number;
}

/** Body gửi lên POST /api/refunds khi customer xác nhận hủy (AC3). */
export type CreateRefundRequest =
  | {
      bookingId: number;
      refundMethod: "BANK_TRANSFER";
      bankBin: string; // BIN ngân hàng khách chọn (map từ BankEnum)
      accountNumber: string;
      accountHolder: string;
    }
  | {
      bookingId: number;
      refundMethod: "LOYALTY_POINTS";
    };

/** Bản ghi Refund trả về sau khi tạo. */
export interface RefundResponse {
  id: number;
  bookingId: number;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  refundAmount: number | null;
  pointsAwarded: number | null;
  status: string;
  bookingStatus: string;
  createdAt: string;
}

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

/** Body gửi lên POST /api/refunds khi customer xác nhận hủy (AC3). */
export interface CreateRefundRequest {
  bookingId: number;
  bankBin: string; // BIN ngân hàng khách chọn (map từ BankEnum)
  accountNumber: string;
  accountHolder: string;
}

/** Bản ghi Refund trả về sau khi tạo. */
export interface RefundResponse {
  id: number;
  bookingId: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  refundAmount: number;
  status: string;
  bookingStatus: string;
  createdAt: string;
}

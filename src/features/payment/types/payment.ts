/* @author: BaoNgoc */
// Types cho luồng checkout & thanh toán tiền mặt của feature payment

// Hạng thành viên (khớp tier trong DB.txt)
export type MembershipTier =
  | "WALK_IN"
  | "MEMBER"
  | "SILVER"
  | "GOLD"
  | "PLATINUM";

export type VoucherDiscountType = "PERCENTAGE" | "FIXED";

// ── Checkout: GET /api/payment/checkout/{bookingId} ──────────────────────────

export interface CheckoutVehicle {
  licensePlate: string;
  brandName: string;
  color: string;
}

export interface CheckoutCustomer {
  userId: number;
  fullName: string;
  membershipTier: MembershipTier;
}

export interface CheckoutServiceItem {
  serviceId: number;
  serviceName: string;
  price: number;
}

export interface CheckoutServiceDetails {
  // Đã bao gồm cả gói dịch vụ và add-on -> hóa đơn không cần chọn lại service
  items: CheckoutServiceItem[];
  technicianName: string;
  stationName: string;
  startTime: string;
  endTime: string;
}

export interface CheckoutLoyaltyPoints {
  availablePoints: number; // tổng điểm khách đang có
  availablePointsValue: number; // quy ra tiền của số điểm đang có
  pointsApplied: number; // điểm đã áp trước đó (nếu khách chọn khi đặt web)
  pointsAppliedDiscount: number;
  pointsEarnedAfterPayment: number;
  maxApplicablePoints: number; // trần điểm được phép dùng cho hóa đơn này
}

export interface CheckoutVoucher {
  voucherCode: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  discountAmount: number;
  isValid: boolean;
  errorMessage: string | null;
}

export interface CheckoutInvoiceSummary {
  subtotal: number;
  depositPaid: number;
  loyaltyDiscount: number;
  voucherDiscount: number;
  totalDue: number;
}

export interface PaymentCheckoutResponse {
  bookingId: number;
  vehicle: CheckoutVehicle;
  customer: CheckoutCustomer;
  serviceDetails: CheckoutServiceDetails;
  depositPaid: number;
  loyaltyPoints: CheckoutLoyaltyPoints;
  voucher: CheckoutVoucher | null;
  invoiceSummary: CheckoutInvoiceSummary;
}

// ── Cash payment: POST /api/payments/cash ────────────────────────────────────

export interface CashPaymentRequest {
  bookingId: number;
  usedLoyaltyPoints: number; // số điểm staff đã đổi trên màn thanh toán
  receivedAmount: number;
}

export interface CashPaymentResponse {
  invoiceId: number;
  totalAmount: number;
  receivedAmount: number;
  changeAmount: number;
  bookingStatus: string;
  paymentStatus: string;
}

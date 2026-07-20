// ====== API-02-01: GET BOOKING CONTEXT ======

export interface BookingVehicle {
  id: number;
  licensePlate: string;
  brandName: string;
  activeSubscription?: {
    type: "UNLIMITED" | "FAMILY";
    servicePackageId: number;
    // Danh sách các ngày (ISO, "yyyy-MM-dd") trong bookingWindow mà gói này đã được
    // dùng cho 1 booking khác rồi. FE so ngày đang chọn với mảng này để biết hiện
    // giá 0đ hay giá thường, áp dụng cho mọi ngày trong bookingWindow, không chỉ hôm nay.
    usedDates: string[];
  } | null;
}

export interface BookingServicePackage {
  id: number;
  name: string;
  basePrice: number;
  durationMinutes: number;
  addonServiceIds: number[];
}

export interface BookingAddonService {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface BookingVoucher {
  id: number;
  voucherCode: string;
  discountPercentage: number;
  minOrderValue: number;
}

export interface BookingWindow {
  minDate: string; // "2026-06-17"
  maxDate: string; // "2026-06-24"
}

export interface BookingStation {
  id: number;
  stationName: string;
  address: string;
}

export interface BookingContext {
  station: BookingStation;
  bookingWindow: BookingWindow;
  vehicles: BookingVehicle[];
  servicePackages: BookingServicePackage[];
  addonServices: BookingAddonService[];
  vouchers: BookingVoucher[];
}

// errorCode riêng khi customer chưa có xe (theo API-02-01 case fail)
export const NO_VEHICLE_REGISTERED = "NO_VEHICLE_REGISTERED";

// errorCode khi customer đang bị hạn chế đặt lịch do vi phạm quá số lần (API-02-03 case fail)
export const CUSTOMER_RESTRICTED = "CUSTOMER_005";

// ====== API-02-03: CREATE BOOKING ======

export interface CreateBookingRequest {
  stationId: number;
  vehicleId: number;
  servicePackageId: number;
  addonServiceIds: number[];
  appointmentDate: string; // "2026-06-18"
  slotIds: number[];
  voucherCode?: string;
}

export interface CreateBookingResponse {
  bookingId: number;
  status: string;
  totalAmount: number;
  slotIds: number[];
  depositAmount: number;
  transferContent: string;
  // Ảnh QR VietQR (qua SePay) đã điền sẵn số tài khoản/số tiền/nội dung - FE chỉ cần <img src>
  qrImageUrl: string;
  expiresAt: string; // ISO datetime (Instant) - hạn chót thanh toán cọc
}

// ====== API-02-04: PREVIEW BOOKING PRICE ======

export interface PreviewPriceRequest {
  stationId: number;
  vehicleId: number;
  servicePackageId: number;
  addonServiceIds: number[];
  appointmentDate: string;
  voucherCode?: string;
}

export interface PreviewPriceBreakdown {
  servicePrice: number;
  addonPrice: number;
  subTotal: number;
  voucherCode?: string;
  voucherDiscount: number;
  finalTotal: number;
}

export interface PreviewPriceAppliedVoucher {
  valid: boolean;
  discountPercentage: number;
}

export interface PreviewPriceResponse {
  currency: string;
  // true nếu vehicle đã có booking khác dùng subscription để miễn phí đúng vào
  // appointmentDate đã gửi lên -> BE trả giá thường (không phải 0đ) cho servicePrice
  isVehicleBookingOnDateAndHasSubscription: boolean;
  breakdown: PreviewPriceBreakdown;
  appliedVoucher?: PreviewPriceAppliedVoucher;
}
/**
 * Lifecycle status of a booking, as returned by the backend's
 * `BookingCardResponse.status` field.
 *
 * - `CONFIRMED` / `CHECK_IN` / `WASHING` — appear in the "upcoming" list.
 * - `PAID` / `CANCELED` / `NO_SHOW` — appear in the "past" list.
 */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECK_IN"
  | "WASHING"
  | "PAID"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW"
  | "CHECK_OUT"
  | "REFUND_PENDING"
  | "REFUNDED";

/**
 * Action a customer is allowed to take on a given booking, as returned by
 * the backend's `BookingCardResponse.allowedActions` field. The list of
 * buttons shown on a booking card must be filtered to only this set.
 */
export type BookingAction = "CANCEL" | "WRITE_REVIEW" | "VIEW_DETAILS";

/**
 * Mirrors the backend's `BookingCardResponse` DTO
 * (`com.swp.autocarwash.booking.dto.response.BookingCardResponse`), as
 * returned by `GET /api/bookings/upcoming` and `GET /api/bookings/past`.
 */
export interface BookingCard {
  bookingId: number;
  serviceName: string;
  licensePlate: string;
  brandName: string;
  color: string;
  status: BookingStatus;
  appointmentDate: string;
  startTime: string | null;
  endTime: string | null;
  allowedActions: BookingAction[];
  refundAmount?: number | null;
  refundAccountNumber?: string | null;
  refundedAt?: string | null;
}

export interface BookingAddon {
  addonName: string;
  addonPrice: number;
}

/**
 * Mirrors the backend's `BookingDetailResponse` DTO
 * (`com.swp.autocarwash.booking.dto.response.BookingDetailResponse`), as
 * returned by `GET /api/bookings/{bookingId}`.
 */
export interface BookingDetail {
  bookingId: number;
  status: BookingStatus;
  serviceName: string;
  addons: BookingAddon[];
  licensePlate: string;
  brandName: string;
  color: string;
  stationName: string | null;
  stationAddress: string | null;
  appointmentDate: string;
  startTime: string | null;
  endTime: string | null;
  // Thời điểm check-in thực tế, format "yyyy-MM-dd HH:mm:ss" (spring.jackson.date-format) — null nếu chưa check-in
  checkInAt: string | null;
  technicianName: string | null;
  servicePrice: number;
  addonTotal: number;
  voucherCode: string | null;
  voucherDiscountPercent: number | null;
  voucherDiscountAmount: number;
  customerTier: string | null;
  customerName: string | null;
  bookingType: string | null;
  serviceCategoryName: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  pointDiscountAmount: number;
  loyaltyPoint: number | null;
  pointsEarned: number | null;
  pointsRedeemed: number | null;
  discountAmount: number;
  totalAmount: number;
  isDepositPaid: boolean;
  depositAmount: number | null;
  remainingAmount: number;
  refundBankName?: string | null;
  refundAccountNumber?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
}

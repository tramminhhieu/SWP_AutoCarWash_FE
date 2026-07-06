/* @author: BaoNgoc */
import type { BookingDetail } from "../../booking/types/booking";

// ── Domain constants ─────────────────────────────────────────────────────────

/** Hạng thành viên (customer_tier.tier_name). */
export type CustomerTier = "MEMBER" | "SILVER" | "GOLD" | "PLATINUM";

/** Loại booking. */
export type BookingType = "WALK_IN" | "ADVANCE" | "SUBSCRIPTION";

/** Đổi điểm: 1 điểm = 10 VND khi trừ vào hóa đơn. */
export const POINT_TO_VND = 10;

/** 1.000 VND chi tiêu = 1 điểm (trước khi nhân hệ số hạng). */
export const VND_PER_EARN_POINT = 1000;

/**
 * Hệ số nhân điểm theo hạng (customer_tier.point_multiple).
 * API detail chỉ trả `customerTier` (tên hạng) chứ không trả số nhân,
 * nên map cứng ở FE theo quy định nghiệp vụ.
 */
export const TIER_POINT_MULTIPLIER: Record<CustomerTier, number> = {
  MEMBER: 1, // < 3tr chi tiêu
  SILVER: 1.2, // >= 3tr
  GOLD: 1.5, // >= 8tr
  PLATINUM: 2, // >= 20tr
};

/**
 * Điểm khách tích được sau đơn này.
 * Tính trên subtotal (TRƯỚC mọi giảm giá): floor(subtotal / 1000) * hệ số hạng.
 */
export function calcEarnedPoints(
  subtotal: number,
  tier: CustomerTier | null,
): number {
  const basePoints = Math.floor(subtotal / VND_PER_EARN_POINT);
  const multiplier = tier ? TIER_POINT_MULTIPLIER[tier] : 1;
  return Math.floor(basePoints * multiplier);
}

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Booking detail dùng riêng cho màn thanh toán — mở rộng {@link BookingDetail}
 * với các field mà API `GET /api/bookings/{id}` mới bổ sung (điểm hiện có, hạng
 * khách, loại booking, thông tin gói subscription...).
 */
export interface PaymentBookingDetail extends BookingDetail {
  customerName: string | null;
  customerTier: CustomerTier | null;
  bookingType: BookingType | null;
  loyaltyPoint: number; // điểm hiện có của khách (loyalty_point_balance.total_points)
  pointDiscountAmount: number; // tiền đã giảm bằng điểm sẵn có (nếu đơn web đã đổi trước)
  discountAmount: number;
  serviceCategoryName: string | null;
  subscriptionPlanName: string | null;
  subscriptionPlanType: string | null;
  subscriptionDurationDays: number | null;
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface CashPaymentRequest {
  bookingId: number;
  /** Số điểm khách dùng để đổi thưởng; BE tự tính point_discount = usedLoyaltyPoints * 10. Không đổi thì gửi 0. */
  usedLoyaltyPoints: number;
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

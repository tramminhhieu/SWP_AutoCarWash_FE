/*
 * @author: Bảo Ngọc
 * @version 5.0 — bám response phẳng mới của endpoint checkout (envelope { success, message, data })
 * - Hóa đơn theo form Order Summary của BookingCreate
 * - Dịch vụ = servicePrice + addons[]; không lặp lại service selection
 * - Đổi điểm tính hết ở FE: discount = điểm × 10, trần = loyaltyPoint, điểm nhận = total/1000 × hệ số hạng
 * - Confirm gửi POST /api/payments/cash kèm usedLoyaltyPoints
 */
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Car,
  User,
  Wrench,
  Receipt,
  Calendar,
  Coins,
  MapPin,
} from "lucide-react";
import { formatCurrency as formatVND } from "../../../utils/format";
import { getPaymentCheckout, processCashPayment } from "../api/paymentApi";
import type { PaymentCheckoutResponse } from "../types/payment";

// Quy đổi điểm: 1 điểm = 10 VND khi dùng để giảm giá
const POINT_VALUE_VND = 10;

// Hệ số nhân điểm thưởng theo hạng (khớp customer_tier.point_multiple trong DB.txt)
// điểm nhận = total cuối / 1.000 × hệ số hạng
const TIER_POINT_MULTIPLIER: Record<string, number> = {
  MEMBER: 1,
  SILVER: 1.2,
  GOLD: 1.5,
  PLATINUM: 2,
  WALK_IN: 1, // khách vãng lai tính theo hệ số cơ bản
};

// "2026-07-05" + "21:00:00"/"21:15:00" -> "05 Jul 2026 • 21:00 - 21:15"
function formatSchedule(date: string, start: string, end: string) {
  if (!date) return "";
  const d = new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hm = (t?: string) => (t ? t.slice(0, 5) : "");
  if (start && end) return `${d} • ${hm(start)} - ${hm(end)}`;
  if (start) return `${d} • ${hm(start)}`;
  return d;
}

// Viết hoa chữ đầu (GOLD -> Gold, WALK_IN -> Walk-in)
const formatTier = (tier: string) =>
  tier === "WALK_IN" ? "Walk-in" : tier.charAt(0) + tier.slice(1).toLowerCase();

export default function PaymentPage() {
  const navigate = useNavigate();
  const { bookingId: bookingIdParam } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const state = (location.state as { bookingId?: number } | null) ?? null;
  const bookingId = Number(bookingIdParam ?? state?.bookingId);

  const [checkout, setCheckout] = useState<PaymentCheckoutResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(
    bookingId ? "" : "Failed to find booking.",
  );
  const [isPaying, setIsPaying] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [received, setReceived] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0); // điểm staff nhập để đổi
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const load = async () => {
      try {
        const data = await getPaymentCheckout(bookingId);
        setCheckout(data);
        // Khởi tạo ô điểm theo số điểm BE đã áp trước đó (nếu có), quy ngược từ tiền giảm
        setUsedPoints(
          Math.round((data.pointDiscountAmount ?? 0) / POINT_VALUE_VND),
        );
      } catch {
        setLoadError("Failed to load checkout details.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  if (loadError || !checkout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-error">
          {loadError || "An error occurred."}
        </p>
        <button
          onClick={() => navigate("/staff/queue")}
          className="text-sm font-semibold text-primary"
        >
          Back to Queue
        </button>
      </div>
    );
  }

  // ── Dữ liệu từ checkout ────────────────────────────────────────────────────
  const c = checkout;
  const isWalkIn = c.customerTier === "WALK_IN";
  const tierLabel = formatTier(c.customerTier);
  const multiplier = TIER_POINT_MULTIPLIER[c.customerTier] ?? 1;

  // Voucher chỉ áp cho booking web; khách vãng lai không dùng voucher. Chỉ hiển thị, staff không sửa.
  const showVoucher =
    !isWalkIn && !!c.voucherCode && c.voucherDiscountAmount > 0;

  const subtotal = c.servicePrice + c.addonTotal;
  const depositDeducted = c.isDepositPaid ? c.depositAmount : 0;

  // Số tiền phải trả TRƯỚC khi đổi điểm ở FE = remainingAmount cộng lại phần điểm BE đã áp
  const amountBeforePoints = Math.max(
    c.remainingAmount + c.pointDiscountAmount,
    0,
  );

  // Trần điểm được dùng: không quá điểm đang có và không vượt số tiền phải trả
  const maxRedeemable = Math.min(
    c.loyaltyPoint,
    Math.floor(amountBeforePoints / POINT_VALUE_VND),
  );

  // Giảm giá do đổi điểm — tính ngay ở FE (1 điểm = 10 VND)
  const loyaltyDiscount = usedPoints * POINT_VALUE_VND;

  // Tổng cuối sau khi trừ điểm (không âm)
  const totalDue = Math.max(amountBeforePoints - loyaltyDiscount, 0);

  // Điểm nhận sau thanh toán = (total cuối / 1.000) × hệ số hạng, làm tròn xuống
  const earnedPoints = Math.floor((totalDue / 1000) * multiplier);

  const change = received - totalDue;
  const isInsufficient = received > 0 && received < totalDue;
  const canConfirm = totalDue === 0 || received >= totalDue;

  // Nhập điểm đổi: chặn số âm và không vượt trần được dùng
  const handlePointsChange = (raw: string) => {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setUsedPoints(Math.min(n, maxRedeemable));
  };

  const handleConfirm = async () => {
    if (!canConfirm || !bookingId) return;
    setPayError("");
    setIsPaying(true);
    try {
      await processCashPayment({
        bookingId,
        usedLoyaltyPoints: usedPoints,
        receivedAmount: received,
      });
      setPaySuccess(true);
    } catch {
      setPayError("Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/staff/queue")}
          className="rounded-full p-1.5 hover:bg-surface-container transition"
        >
          <ArrowLeft className="w-5 h-5 text-outline" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-on-background">
            Checkout & Payment
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Booking #{c.bookingId}
          </p>
        </div>
      </div>

      {paySuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative rounded-2xl p-8 bg-surface-container-lowest border border-outline-variant/30 flex flex-col items-center gap-4 max-w-sm w-full mx-4 shadow-xl">
            <button
              onClick={() =>
                navigate("/staff/queue", {
                  state: { paidBookingId: c.bookingId },
                })
              }
              className="absolute top-3 right-3 rounded-full p-1.5 hover:bg-surface-container transition text-outline"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-on-surface mb-1">
                Payment Successful
              </h2>
              <p className="text-sm text-on-surface-variant">
                Booking #{c.bookingId} has been completed.
              </p>
            </div>
            <button
              onClick={() =>
                navigate("/staff/queue", {
                  state: { paidBookingId: c.bookingId },
                })
              }
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary transition"
            >
              Back to Queue
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* ===== CỘT TRÁI: thông tin xe & khách ===== */}
        <div className="col-span-2 space-y-4">
          {/* Vehicle */}
          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">Vehicle</p>
            </div>
            <p className="text-lg font-bold text-on-surface tracking-wide">
              {c.licensePlate}
            </p>
            <p className="text-sm text-on-surface-variant">
              {c.brandName} • {c.color}
            </p>
          </div>

          {/* Customer */}
          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">Customer</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-on-surface">
                {c.customerName}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary-fixed/20 text-primary">
                {tierLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ===== CỘT PHẢI: hóa đơn + thanh toán ===== */}
        <div className="space-y-4">
          {/* Hóa đơn — form Order Summary của BookingCreate */}
          <aside className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <div className="flex items-center gap-2 pb-5">
              <Receipt size={18} className="text-primary" />
              <h2 className="text-headline-md text-on-surface">Invoice</h2>
            </div>

            {/* Dịch vụ chính */}
            <div className="flex items-start justify-between gap-2 pb-1">
              <div>
                <p className="text-body-md font-medium text-on-surface">
                  {c.serviceName}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {c.serviceCategoryName}
                </p>
              </div>
              <span className="shrink-0 text-body-md font-medium text-on-surface">
                {formatVND(c.servicePrice)}
              </span>
            </div>

            {/* Gói subscription (nếu booking thuộc gói) */}
            {c.subscriptionPlanName && (
              <p className="mb-2 text-body-sm text-primary">
                Thuộc gói: {c.subscriptionPlanName}
              </p>
            )}

            {/* Add-on đã đặt */}
            {c.addons.map((a, i) => (
              <div
                key={a.addonServiceId ?? i}
                className="flex items-start justify-between gap-2 pb-1 pt-2"
              >
                <p className="text-body-sm text-on-surface-variant">
                  + {a.name}
                </p>
                <span className="shrink-0 text-body-sm text-on-surface-variant">
                  {formatVND(a.price)}
                </span>
              </div>
            ))}

            {/* Kỹ thuật viên phục vụ + chi nhánh + lịch hẹn */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <Wrench size={14} className="shrink-0 text-primary" />
                <span>
                  Technician:{" "}
                  <span className="font-medium text-on-surface">
                    {c.technicianName ?? "Chưa phân công"}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <MapPin size={14} className="shrink-0 text-primary" />
                <span>{c.stationName}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-body-md text-on-surface">
                <Calendar size={16} className="text-on-surface-variant" />
                <span>
                  {formatSchedule(c.appointmentDate, c.startTime, c.endTime)}
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-outline-variant" />

            {/* Subtotal */}
            <div className="flex items-center justify-between pb-2">
              <span className="text-body-md text-on-surface-variant">
                Subtotal
              </span>
              <span className="text-body-md text-on-surface">
                {formatVND(subtotal)}
              </span>
            </div>

            {/* Đặt cọc đã thanh toán (nếu có) */}
            {depositDeducted > 0 && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-body-md text-on-surface-variant">
                  Deposit Paid
                </span>
                <span className="text-body-md text-tertiary">
                  -{formatVND(depositDeducted)}
                </span>
              </div>
            )}

            {/* Giảm giá khác (nếu có) */}
            {c.discountAmount > 0 && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-body-md text-on-surface-variant">
                  Discount
                </span>
                <span className="text-body-md text-tertiary">
                  -{formatVND(c.discountAmount)}
                </span>
              </div>
            )}

            {/* Voucher — chỉ hiển thị, staff không chỉnh sửa */}
            {showVoucher && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-body-md text-on-surface-variant">
                  Voucher ({c.voucherCode}
                  {c.voucherDiscountPercent
                    ? ` • ${c.voucherDiscountPercent}%`
                    : ""}
                  )
                </span>
                <span className="text-body-md text-tertiary">
                  -{formatVND(c.voucherDiscountAmount)}
                </span>
              </div>
            )}

            {/* Giảm giá do đổi điểm (theo ô nhập bên dưới) */}
            {loyaltyDiscount > 0 && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-body-md text-on-surface-variant">
                  Points Discount ({usedPoints} pts)
                </span>
                <span className="text-body-md text-tertiary">
                  -{formatVND(loyaltyDiscount)}
                </span>
              </div>
            )}

            <div className="mt-3 mb-4 border-t border-outline-variant" />

            {/* Total Due */}
            <div className="flex items-center justify-between">
              <span className="text-body-lg font-semibold text-on-surface">
                Total Due
              </span>
              <span className="text-headline-md text-primary">
                {formatVND(totalDue)}
              </span>
            </div>

            {/* Điểm nhận sau thanh toán — ngay dưới Total Due */}
            <p className="mt-1 text-label-md font-semibold text-tertiary">
              Earns {earnedPoints} points after payment
            </p>

            <div className="my-5 border-t border-outline-variant" />

            {/* Đổi điểm loyalty: tổng điểm hiện có + ô nhập điểm để đổi */}
            <div className="rounded-xl bg-surface-container-low p-4">
              <div className="flex items-center gap-2 mb-3">
                <Coins size={16} className="text-primary" />
                <p className="text-body-md font-semibold text-on-surface">
                  Loyalty Points
                </p>
              </div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-body-md text-on-surface-variant">
                  Available
                </span>
                <span className="text-body-md font-semibold text-on-surface">
                  {c.loyaltyPoint} pts{" "}
                  <span className="font-normal text-on-surface-variant">
                    ({formatVND(c.loyaltyPoint * POINT_VALUE_VND)})
                  </span>
                </span>
              </div>
              <label className="text-xs font-semibold uppercase text-outline block mb-1">
                Redeem Points
              </label>
              <input
                type="number"
                min={0}
                max={maxRedeemable}
                value={usedPoints || ""}
                onChange={(e) => handlePointsChange(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
              />
              <p className="mt-1.5 text-label-sm text-on-surface-variant">
                1 point = {formatVND(POINT_VALUE_VND)} • Max {maxRedeemable} pts
                → -{formatVND(loyaltyDiscount)}
              </p>
            </div>
          </aside>

          {/* Phương thức thanh toán */}
          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <p className="text-sm font-bold text-on-surface mb-3">
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`py-2 rounded-xl text-sm font-semibold border-2 transition ${paymentMethod === "cash" ? "border-primary bg-primary-fixed/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`py-2 rounded-xl text-sm font-semibold border-2 transition ${paymentMethod === "card" ? "border-primary bg-primary-fixed/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}
              >
                Card
              </button>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-outline block">
                  Received Amount
                </label>
                <input
                  type="number"
                  value={received || ""}
                  onChange={(e) => setReceived(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                />
                {isInsufficient && (
                  <p className="text-xs text-error">
                    Received amount is insufficient.
                  </p>
                )}
                {received >= totalDue && totalDue > 0 && (
                  <p className="text-xs text-tertiary">
                    Change to return: {formatVND(change)}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === "card" && (
              <p className="text-xs text-on-surface-variant">
                Demo currently supports Cash payment only.
              </p>
            )}
          </div>

          {payError && (
            <div className="rounded-xl px-4 py-3 bg-error/10 border border-error/30">
              <p className="text-sm text-error">{payError}</p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isPaying}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isPaying ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

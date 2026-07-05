/*
 * @author: Bảo Ngọc
 * @version 4.0 — khớp API GET /api/bookings/{id} mới (loyaltyPoint, customerTier...)
 * - Thêm block đổi điểm thưởng phía trên Subtotal (staff nhập, 0 < điểm < điểm hiện có)
 * - Thêm dòng Points Earned + Deposit Paid dưới Total Due trong Invoice Summary
 * - Voucher chỉ hiện với booking web (ẩn khi WALK_IN), staff không sửa được
 * - Tách toàn bộ API sang services/paymentApi.ts (fetch detail + processCashPayment)
 */
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Car, User, Wrench } from "lucide-react";
import { formatCurrency as formatVND } from "../../../utils/format";
import { getPaymentBookingDetail, processCashPayment } from "../api/paymentApi";
import {
  calcEarnedPoints,
  POINT_TO_VND,
  type PaymentBookingDetail,
} from "../types/payment";

function formatSchedule(date: string, start: string, end: string) {
  if (!date) return "";
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!start || !end) return dateStr;
  return `${dateStr}, ${start} - ${end}`;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { bookingId: bookingIdParam } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const state = (location.state as { bookingId?: number } | null) ?? null;
  const bookingId = Number(bookingIdParam ?? state?.bookingId);

  const [detail, setDetail] = useState<PaymentBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(
    bookingId ? "" : "Failed to find booking.",
  );
  const [isPaying, setIsPaying] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [received, setReceived] = useState(0);
  const [redeemInput, setRedeemInput] = useState(""); // điểm staff nhập để đổi thưởng
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    if (!bookingId) return; // ← chỉ return sớm, không setState
    const load = async () => {
      try {
        const data = await getPaymentBookingDetail(bookingId);
        setDetail(data);
      } catch {
        setLoadError("Failed to load booking details.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const addOns = detail?.addons ?? [];
  const baseAmount = detail?.servicePrice ?? 0;
  const addOnTotal = detail?.addonTotal ?? 0;
  const subtotal = baseAmount + addOnTotal;
  const voucherDiscount = detail?.voucherDiscountAmount ?? 0;
  const pointDiscount = detail?.pointDiscountAmount ?? 0; // điểm đã đổi sẵn (nếu có)

  // ── Đổi điểm thưởng tại quầy ──────────────────────────────────────────────
  const currentPoints = detail?.loyaltyPoint ?? 0;
  // Điểm hợp lệ khi: 0 < điểm nhập < điểm hiện có của khách
  const redeemPoints = Math.floor(Number(redeemInput)) || 0;
  const isRedeemInvalid =
    redeemInput.trim() !== "" &&
    (redeemPoints <= 0 || redeemPoints >= currentPoints);
  const redeemDiscount = isRedeemInvalid ? 0 : redeemPoints * POINT_TO_VND;

  // ── Điểm tích được sau đơn (trên subtotal, trước giảm giá) ─────────────────
  const earnedPoints = calcEarnedPoints(subtotal, detail?.customerTier ?? null);

  const tierLabel = detail?.customerTier
    ? detail.customerTier.charAt(0) + detail.customerTier.slice(1).toLowerCase()
    : "Walk-in";
  const bookingTypeLabel =
    detail?.bookingType === "WALK_IN"
      ? "Walk-in"
      : detail?.bookingType === "SUBSCRIPTION"
        ? "Subscription"
        : detail?.bookingType === "ADVANCE"
          ? "Advance"
          : null;

  // Tổng trước khi trừ điểm staff đổi (ưu tiên số BE trả, fallback tự tính)
  const baseTotal =
    detail?.remainingAmount ??
    Math.max(subtotal - voucherDiscount - pointDiscount, 0);
  const total = Math.max(baseTotal - redeemDiscount, 0);
  const change = received - total;
  const isInsufficient = received > 0 && received < total;
  const canConfirm =
    !isRedeemInvalid && (total === 0 || (received >= total && total > 0));

  const handleConfirm = async () => {
    if (!canConfirm || !bookingId) return;
    setPayError("");
    setIsPaying(true);
    try {
      await processCashPayment({
        bookingId,
        receivedAmount: received,
        // chỉ gửi điểm khi staff nhập hợp lệ và > 0
        redeemPoints: redeemDiscount > 0 ? redeemPoints : undefined,
      });
      setPaySuccess(true);
    } catch {
      setPayError("Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  if (loadError || !detail) {
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
            Booking #{bookingId}
          </p>
        </div>
      </div>

      {paySuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative rounded-2xl p-8 bg-surface-container-lowest border border-outline-variant/30 flex flex-col items-center gap-4 max-w-sm w-full mx-4 shadow-xl">
            <button
              onClick={() =>
                navigate("/staff/queue", {
                  state: { paidBookingId: bookingId },
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
                Booking #{bookingId} has been completed.
              </p>
            </div>
            <button
              onClick={() =>
                navigate("/staff/queue", {
                  state: { paidBookingId: bookingId },
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
        {/* Left: booking info */}
        <div className="col-span-2 space-y-4">
          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">Vehicle</p>
            </div>
            <p className="text-lg font-bold text-on-surface tracking-wide">
              {detail.licensePlate}
            </p>
            <p className="text-sm text-on-surface-variant">
              {detail.brandName} • {detail.color}
            </p>
          </div>

          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">Customer</p>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-on-surface">
                {detail.customerName ?? "—"}
              </p>
              {bookingTypeLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary-fixed/20 text-primary">
                  {bookingTypeLabel}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs uppercase mb-1"
                  style={{ color: "#747686" }}
                >
                  Membership Tier
                </p>
                <p className="text-sm" style={{ color: "#747686" }}>
                  {tierLabel}
                </p>
              </div>
              {/* Voucher chỉ hiện với booking web; walk-in không dùng voucher. Staff không sửa được (chỉ hiển thị) */}
              {detail.bookingType !== "WALK_IN" && detail.voucherCode && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary-fixed text-on-secondary-fixed">
                  Voucher: {detail.voucherCode}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">
                Service Details
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">
                  {detail.serviceName}
                </span>
                <span className="text-on-surface font-medium">
                  {formatVND(baseAmount)}
                </span>
              </div>
              {addOns.map((addon, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">
                    + {addon.addonName}
                  </span>
                  <span className="text-on-surface font-medium">
                    {formatVND(addon.addonPrice)}
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-outline-variant text-xs text-on-surface-variant space-y-1">
                {detail.serviceCategoryName && (
                  <p>Package: {detail.serviceCategoryName}</p>
                )}
                <p>
                  Station: {detail.stationName} — {detail.stationAddress}
                </p>
                <p>
                  📅{" "}
                  {formatSchedule(
                    detail.appointmentDate,
                    detail.startTime ?? "",
                    detail.endTime ?? "",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: payment panel */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <p className="text-sm font-bold text-on-surface mb-3">
              Invoice Summary
            </p>

            {/* Đổi điểm thưởng — đặt PHÍA TRÊN Subtotal theo yêu cầu */}
            <div className="mb-3 rounded-xl p-3 bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-outline">
                  Loyalty Points
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {currentPoints.toLocaleString("en-US")} pts
                </span>
              </div>
              <input
                type="number"
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value)}
                placeholder="Points to redeem"
                min={1}
                max={currentPoints > 0 ? currentPoints - 1 : 0}
                disabled={currentPoints <= 0}
                className="w-full rounded-lg px-3 py-2 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isRedeemInvalid ? (
                <p className="text-xs text-error mt-1">
                  Points must be greater than 0 and less than {currentPoints}.
                </p>
              ) : redeemDiscount > 0 ? (
                <p className="text-xs text-green-600 mt-1">
                  Redeeming {redeemPoints} pts = -{formatVND(redeemDiscount)}
                </p>
              ) : (
                <p className="text-xs text-on-surface-variant mt-1">
                  1 point = {formatVND(POINT_TO_VND)}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface">{formatVND(subtotal)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    Voucher Discount
                  </span>
                  <span className="text-green-600">
                    - {formatVND(voucherDiscount)}
                  </span>
                </div>
              )}
              {pointDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    Point Discount
                  </span>
                  <span className="text-green-600">
                    - {formatVND(pointDiscount)}
                  </span>
                </div>
              )}
              {redeemDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    Points Redeemed
                  </span>
                  <span className="text-green-600">
                    - {formatVND(redeemDiscount)}
                  </span>
                </div>
              )}
              <div className="border-t border-outline-variant pt-2 flex justify-between font-bold">
                <span className="text-on-surface">Total Due</span>
                <span className="text-primary">{formatVND(total)}</span>
              </div>

              {/* Điểm tích được sau khi hoàn tất — dưới Total Due */}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Points Earned</span>
                <span className="text-green-600 font-semibold">
                  +{earnedPoints} pts
                </span>
              </div>

              {/* Đã cọc trước (nếu có) */}
              {detail.isDepositPaid && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Deposit Paid</span>
                  <span className="text-on-surface">
                    {formatVND(detail.depositAmount ?? 0)}
                  </span>
                </div>
              )}
            </div>
          </div>

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
                {received >= total && total > 0 && (
                  <p className="text-xs text-green-600">
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

/*
 * @author: Bảo Ngọc
 * @version 3.0 — lấy dữ liệu thật từ GET /api/bookings/{bookingId} thay cho mock
 * ported onto dev: bookingApi import path đổi sang ../../booking/api/bookingApi,
 * type BookingDetailResponse -> BookingDetail (dev không có customerTier),
 * formatVND -> alias từ utils/format (dev không có utils/currency.ts),
 * handleConfirm nối thật vào processCashPayment (paymentApi.ts)
 */
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Car, User, Wrench } from "lucide-react";
import { formatCurrency as formatVND } from "../../../utils/format";
import { getBookingDetail } from "../../booking/api/bookingApi";
import type { BookingDetail } from "../../booking/api/bookingApi";
import { processCashPayment } from "../services/paymentApi";

function formatSchedule(date: string, start: string, end: string) {
  if (!date) return "";
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (!start || !end) return dateStr;
  return `${dateStr}, ${start} - ${end}`;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { bookingId: bookingIdParam } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const state = (location.state as { bookingId?: number } | null) ?? null;
  const bookingId = Number(bookingIdParam ?? state?.bookingId);

  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [received, setReceived] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      setLoadError("Không tìm thấy booking.");
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await getBookingDetail(bookingId);
        setDetail(data);
      } catch {
        setLoadError("Không tải được thông tin booking.");
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
  const total = detail?.remainingAmount ?? Math.max(subtotal - voucherDiscount, 0);
  const change = received - total;
  const isInsufficient = received > 0 && received < total;
  const canConfirm = received >= total && total > 0;

  const handleConfirm = async () => {
    if (!canConfirm || !bookingId) return;
    if (paymentMethod !== "cash") {
      alert("Bản demo hiện chỉ hỗ trợ thanh toán Cash.");
      return;
    }
    setIsPaying(true);
    try {
      const result = await processCashPayment({ bookingId, receivedAmount: received });
      alert(`Payment successful! Change: ${formatVND(result.changeAmount)}`);
      navigate("/staff/queue");
    } catch {
      alert("Thanh toán thất bại, thử lại.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">Đang tải...</p>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-error">{loadError || "Có lỗi xảy ra."}</p>
        <button onClick={() => navigate("/staff/queue")} className="text-sm font-semibold text-primary">
          Về Queue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/staff/queue")} className="rounded-full p-1.5 hover:bg-surface-container transition">
          <ArrowLeft className="w-5 h-5 text-outline" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-on-background">Checkout & Payment</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Booking #{bookingId}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: booking info */}
        <div className="col-span-2 space-y-4">
          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">Vehicle</p>
            </div>
            <p className="text-lg font-bold text-on-surface tracking-wide">{detail.licensePlate}</p>
            <p className="text-sm text-on-surface-variant">{detail.brandName} • {detail.color}</p>
          </div>

          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">Customer</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>Membership Tier</p>
                {/* dev's BE booking-detail endpoint chưa trả customerTier, tạm hiển thị Walk-in */}
                <p className="text-sm" style={{ color: "#747686" }}>Walk-in</p>
              </div>
              {detail.voucherCode && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary-fixed text-on-secondary-fixed">
                  Voucher: {detail.voucherCode}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-on-surface">Service Details</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{detail.serviceName}</span>
                <span className="text-on-surface font-medium">{formatVND(baseAmount)}</span>
              </div>
              {addOns.map((addon, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">+ {addon.addonName}</span>
                  <span className="text-on-surface font-medium">{formatVND(addon.addonPrice)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-outline-variant text-xs text-on-surface-variant space-y-1">
                <p>Technician: {detail.technicianName ?? "—"}</p>
                <p>Station: {detail.stationName} — {detail.stationAddress}</p>
                <p>📅 {formatSchedule(detail.appointmentDate, detail.startTime ?? "", detail.endTime ?? "")}</p>
              </div>
            </div>
          </div>

          {detail.isDepositPaid && (
            <div className="rounded-xl px-4 py-3 bg-surface-container-low border border-outline-variant/30">
              <p className="text-xs text-on-surface-variant">Đã đặt cọc: <span className="font-semibold text-on-surface">{formatVND(detail.depositAmount)}</span></p>
            </div>
          )}
        </div>

        {/* Right: payment panel */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <p className="text-sm font-bold text-on-surface mb-3">Invoice Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface">{formatVND(subtotal)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Voucher Discount</span>
                  <span className="text-green-600">- {formatVND(voucherDiscount)}</span>
                </div>
              )}
              <div className="border-t border-outline-variant pt-2 flex justify-between font-bold">
                <span className="text-on-surface">Total Due</span>
                <span className="text-primary">{formatVND(total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/30">
            <p className="text-sm font-bold text-on-surface mb-3">Payment Method</p>
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
                <label className="text-xs font-semibold uppercase text-outline block">Received Amount</label>
                <input
                  type="number"
                  value={received || ""}
                  onChange={(e) => setReceived(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                />
                {isInsufficient && (
                  <p className="text-xs text-error">Số tiền nhận chưa đủ.</p>
                )}
                {received >= total && total > 0 && (
                  <p className="text-xs text-green-600">Tiền thừa trả khách: {formatVND(change)}</p>
                )}
              </div>
            )}

            {paymentMethod === "card" && (
              <p className="text-xs text-on-surface-variant">Bản demo hiện chỉ hỗ trợ thanh toán Cash.</p>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isPaying}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isPaying ? "Đang xử lý..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

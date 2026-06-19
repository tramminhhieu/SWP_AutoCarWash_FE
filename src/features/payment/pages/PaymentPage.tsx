/*@author: Bảo Ngọc 
 @version 1.0
*/
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

interface BookingState {
  bookingId: number;
  licensePlate: string;
  model: string;
  color: string;
  service: string;
  totalAmount: number;
  voucherDiscount?: number;
  pointDiscount?: number;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state as BookingState;

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr">("cash");
  const [receivedAmount, setReceivedAmount] = useState("");

  const total = booking?.totalAmount ?? 0;
  const voucher = booking?.voucherDiscount ?? 0;
  const points = booking?.pointDiscount ?? 0;
  const subtotal = total + voucher + points;
  const received = parseFloat(receivedAmount || "0");
  const change = received - total;
  const isInsufficient = receivedAmount !== "" && received < total;
  const canConfirm = paymentMethod === "qr" || received >= total;

  const handleConfirm = () => {
    alert(`Payment successful! Booking #${booking.bookingId} checked out.`);
    navigate("/staff/queue");
  };

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">No booking selected.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {/* Top bar — App name */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/staff/queue")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-500 text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-base font-bold text-[#0037b0]">HydroLux</h1>
          <p className="text-xs text-slate-400">Management Portal</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-6">

          {/* Order Summary Header */}
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-base font-bold text-[#1e293b]">Order Summary</h2>
          </div>

          {/* Service items */}
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-[#1e293b]">{booking.service}</p>
              <p className="text-xs text-slate-400">{booking.model} • {booking.licensePlate}</p>
              <p className="text-xs text-[#0037b0] mt-0.5">📍 Downtown Detailing Center</p>
            </div>
            <p className="text-sm font-bold text-[#1e293b]">${subtotal}.00</p>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 mt-3 mb-4">
            <span className="text-xs text-slate-500">Oct 18, 2023 • 09:30 AM</span>
          </div>

          <div className="flex justify-between text-xs text-slate-400 mb-4">
            <span>Duration</span>
            <span>45 min (3 slots)</span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 mb-4" />

          {/* Subtotal & discounts */}
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-500">Subtotal</span>
            <span className="text-sm font-semibold text-[#1e293b]">${subtotal}.00</span>
          </div>
          {voucher > 0 && (
            <div className="flex justify-between mb-2">
              <div>
                <p className="text-sm text-yellow-500 font-medium">Applied Voucher</p>
                <p className="text-xs text-slate-400">(WELCOME10)</p>
              </div>
              <span className="text-sm font-semibold text-yellow-500">-${voucher}.00</span>
            </div>
          )}
          {points > 0 && (
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-sm text-yellow-500 font-medium">Loyalty Points</p>
                <p className="text-xs text-slate-400">(500 pts)</p>
              </div>
              <span className="text-sm font-semibold text-yellow-500">-${points}.00</span>
            </div>
          )}

          {/* Payment Method */}
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Select Payment Method</p>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod("qr")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition text-sm font-medium ${
                paymentMethod === "qr"
                  ? "border-[#0037b0] bg-blue-50 text-[#0037b0]"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition text-sm font-medium ${
                paymentMethod === "cash"
                  ? "border-[#0037b0] bg-blue-50 text-[#0037b0]"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              Cash
            </button>
          </div>

          {/* Cash input */}
          {paymentMethod === "cash" && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Received Amount ($)
              </label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0037b0]"
              />
              {receivedAmount && (
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">Change</span>
                  <span className={`text-xs font-semibold ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {change >= 0 ? `$${change.toFixed(2)}` : "—"}
                  </span>
                </div>
              )}
              {isInsufficient && (
                <p className="text-xs text-red-500 mt-1">⚠️ Insufficient payment amount</p>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 mb-4" />

          {/* Total */}
          <div className="flex justify-between items-center mb-5">
            <span className="text-base font-semibold text-[#1e293b]">Total</span>
            <span className="text-2xl font-bold text-[#0037b0]">${total}.00</span>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{ opacity: !canConfirm ? 0.5 : 1 }}
            className="w-full bg-[#0037b0] text-white py-3 rounded-xl font-semibold text-sm transition"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}
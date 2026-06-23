/*
 * @author: Bảo Ngọc
 * @version 2.0
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Car, User, Wrench, Plus, Minus } from "lucide-react";

interface AddOn {
  id: number;
  name: string;
  price: number;
  selected: boolean;
}

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

const mockAddOns: AddOn[] = [
  { id: 1, name: "Interior Vacuum", price: 15, selected: false },
  { id: 2, name: "Tire Shine", price: 10, selected: false },
  { id: 3, name: "Engine Bay Clean", price: 45, selected: false },
  { id: 4, name: "Ceramic Coating", price: 75, selected: false },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state as BookingState;

  const [activeTab, setActiveTab] = useState<"detail" | "payment">("detail");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr">("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [addOns, setAddOns] = useState<AddOn[]>(mockAddOns);

  const voucher = booking?.voucherDiscount ?? 0;
  const points = booking?.pointDiscount ?? 0;
  const baseAmount = booking?.totalAmount ?? 0;
  const addOnTotal = addOns.filter((a) => a.selected).reduce((sum, a) => sum + a.price, 0);
  const subtotal = baseAmount + addOnTotal;
  const total = subtotal - voucher - points;

  const received = parseFloat(receivedAmount || "0");
  const change = received - total;
  const isInsufficient = receivedAmount !== "" && received < total;
  const canConfirm = paymentMethod === "qr" || received >= total;

  const toggleAddOn = (id: number) => {
    setAddOns((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleConfirm = () => {
    alert(`Payment successful! Booking #${booking.bookingId} checked out.`);
    navigate("/staff/queue");
  };

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: "#747686" }}>No booking selected.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f9f9ff" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/staff/queue")}
          className="w-8 h-8 flex items-center justify-center rounded-full transition"
          style={{ background: "#e9edff", color: "#0037b0" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "#141b2b", fontFamily: "Montserrat, sans-serif" }}
          >
            Booking Details — #BK-{booking.bookingId}
          </h1>
          <p className="text-sm" style={{ color: "#434655" }}>
            Manage scheduling, services, and billing
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left — Info */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Customer Information */}
          <div className="rounded-2xl p-5" style={{ background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4" style={{ color: "#0037b0" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#141b2b" }}>Customer Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>Full Name</p>
                <p className="text-sm font-semibold" style={{ color: "#141b2b" }}>Jordan Davis</p>
              </div>
              <div>
                <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>Membership Tier</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dce1ff", color: "#001551" }}>
                  PLATINUM
                </span>
              </div>
              <div>
                <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>Phone Number</p>
                <p className="text-sm" style={{ color: "#141b2b" }}>+1 555-123-4567</p>
              </div>
              <div>
                <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>Email Address</p>
                <p className="text-sm" style={{ color: "#141b2b" }}>j.davis@example.com</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="rounded-2xl p-5" style={{ background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-4 h-4" style={{ color: "#0037b0" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#141b2b" }}>Vehicle Information</h2>
            </div>
            <div className="flex gap-4">
              <div
                className="w-24 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#e9edff" }}
              >
                <Car className="w-8 h-8" style={{ color: "#0037b0" }} />
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div>
                  <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>Vehicle Model</p>
                  <p className="text-sm font-semibold" style={{ color: "#141b2b" }}>{booking.model}</p>
                </div>
                <div>
                  <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>License Plate</p>
                  <p className="text-sm font-semibold" style={{ color: "#0037b0" }}>{booking.licensePlate}</p>
                </div>
                <div>
                  <p className="text-xs uppercase mb-1" style={{ color: "#747686" }}>Color</p>
                  <p className="text-sm" style={{ color: "#141b2b" }}>{booking.color}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service & Add-ons */}
          <div className="rounded-2xl p-5" style={{ background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" style={{ color: "#0037b0" }} />
                <h2 className="font-semibold text-sm" style={{ color: "#141b2b" }}>Service Selection</h2>
              </div>
            </div>

            {/* Main service */}
            <div
              className="rounded-xl p-3 flex items-center justify-between mb-4"
              style={{ background: "#e9edff", border: "2px solid #0037b0" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#0037b0" }}>
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: "#141b2b" }}>{booking.service}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#0037b0" }}>${baseAmount}.00</span>
            </div>

            {/* Add-ons */}
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#747686" }}>Add-on Services</p>
            <div className="flex flex-col gap-2">
              {addOns.map((addon) => (
                <div
                  key={addon.id}
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{
                    background: addon.selected ? "#e9edff" : "#f9f9ff",
                    border: addon.selected ? "2px solid #0037b0" : "2px solid #dce2f7",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{
                        background: addon.selected ? "#0037b0" : "#ffffff",
                        border: addon.selected ? "none" : "2px solid #c4c5d7",
                      }}
                    >
                      {addon.selected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm" style={{ color: "#141b2b" }}>{addon.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "#0037b0" }}>${addon.price}.00</span>
                    {/* {addon.selected ? (
                      <Minus className="w-4 h-4" style={{ color: "#0037b0" }} />
                    ) : (
                      <Plus className="w-4 h-4" style={{ color: "#747686" }} />
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Order Summary + Payment */}
        <div className="w-80 shrink-0">
          <div className="rounded-2xl sticky top-6" style={{ background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            {/* Tabs */}
            <div className="flex border-b px-4 pt-4" style={{ borderColor: "#dce2f7" }}>
              {(["detail", "payment"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 text-sm font-semibold capitalize transition"
                  style={{
                    color: activeTab === tab ? "#0037b0" : "#747686",
                    borderBottom: activeTab === tab ? "2px solid #0037b0" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {tab === "detail" ? "Order Summary" : "Payment"}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Tab: Order Summary */}
              {activeTab === "detail" && (
                <div>
                  {/* Service */}
                  <div className="flex justify-between mb-1">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{booking.service}</p>
                      <p className="text-xs text-on-surface-variant">{booking.model} • {booking.licensePlate}</p>
                      <p className="text-xs font-semibold text-on-surface mt-0.5">HydroLux Station</p>
                      <p className="text-xs text-primary mt-0.5">123 Le Loi</p>
                    </div>
                    <p className="text-sm font-bold text-on-surface whitespace-nowrap">{baseAmount.toLocaleString("vi-VN")} VND</p>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 my-3 bg-surface-container-low">
                    <span className="text-xs text-on-surface-variant">📅 Jun 24, 2026 • 08:15 – 08:45</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-outline-variant my-3" />

                  {/* Subtotal */}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-on-surface-variant">Subtotal</span>
                    <span className="text-sm font-semibold text-on-surface">{baseAmount.toLocaleString("vi-VN")} VND</span>
                  </div>

                  {/* Discount */}
                  {voucher > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-on-surface-variant">Discount (WELCOME10)</span>
                      <span className="text-sm font-semibold text-error">-{voucher.toLocaleString("vi-VN")} VND</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-outline-variant my-3" />

                  {/* Total */}
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-base font-bold text-on-surface">Total</span>
                    <span className="text-2xl font-bold text-primary">{total.toLocaleString("vi-VN")} VND</span>
                  </div>

                  <button
                    onClick={() => setActiveTab("payment")}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition bg-primary text-on-primary"
                  >
                    Proceed to Payment →
                  </button>
                </div>
              )}

              {/* Tab: Payment */}
              {activeTab === "payment" && (
                <div>
                  {voucher > 0 && (
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#006591" }}>Applied Voucher</p>
                        <p className="text-xs" style={{ color: "#747686" }}>(WELCOME10)</p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#006591" }}>-${voucher}.00</span>
                    </div>
                  )}
                  {points > 0 && (
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#006591" }}>Loyalty Points</p>
                        <p className="text-xs" style={{ color: "#747686" }}>(500 pts)</p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#006591" }}>-${points}.00</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: "1px solid #dce2f7" }}>
                    <span className="text-base font-semibold" style={{ color: "#141b2b" }}>Total</span>
                    <span className="text-2xl font-bold" style={{ color: "#0037b0" }}>${total}.00</span>
                  </div>

                  {/* Payment Method */}
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#747686" }}>
                    Select Payment Method
                  </p>
                  <div className="flex gap-2 mb-4">
                    {(["qr", "cash"] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition"
                        style={{
                          border: paymentMethod === method ? "2px solid #0037b0" : "2px solid #dce2f7",
                          background: paymentMethod === method ? "#e9edff" : "#ffffff",
                          color: paymentMethod === method ? "#0037b0" : "#747686",
                        }}
                      >
                        {method === "qr" ? "QR Code" : "Cash"}
                      </button>
                    ))}
                  </div>

                  {/* Cash input */}
                  {paymentMethod === "cash" && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold block mb-1" style={{ color: "#434655" }}>
                        Received Amount
                      </label>
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        placeholder="Enter amount..."
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ border: "1px solid #c4c5d7", color: "#141b2b" }}
                      />
                      {receivedAmount && (
                        <div className="flex justify-between mt-2">
                          <span className="text-xs" style={{ color: "#747686" }}>Change</span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: change >= 0 ? "#005020" : "#ba1a1a" }}
                          >
                            {change >= 0 ? `$${change.toFixed(2)}` : "—"}
                          </span>
                        </div>
                      )}
                      {isInsufficient && (
                        <p className="text-xs mt-1" style={{ color: "#ba1a1a" }}>
                          Insufficient payment amount
                        </p>
                      )}
                    </div>
                  )}

                  {/* QR placeholder */}
                  {paymentMethod === "qr" && (
                    <div
                      className="rounded-xl p-6 text-center mb-4"
                      style={{ background: "#f1f3ff", border: "1px dashed #c4c5d7" }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "#0037b0" }}>QR Code</p>
                      <p className="text-xs mt-1" style={{ color: "#747686" }}>Scan to pay ${total}.00</p>
                    </div>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition"
                    style={{
                      background: "#0037b0",
                      color: "#ffffff",
                      opacity: !canConfirm ? 0.5 : 1,
                      cursor: !canConfirm ? "not-allowed" : "pointer",
                    }}
                  >
                    Confirm Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
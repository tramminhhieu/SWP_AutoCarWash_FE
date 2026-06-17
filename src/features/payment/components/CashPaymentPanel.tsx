import { useCashPayment } from "../hooks/useCashPayment";

interface Props {
  bookingId: number;
  totalAmount: number;
  voucherDiscount?: number;
  pointDiscount?: number;
  onSuccess: (result: any) => void;
  onCancel: () => void;
}

export default function CashPaymentPanel({
  bookingId,
  totalAmount,
  voucherDiscount = 0,
  pointDiscount = 0,
  onSuccess,
  onCancel,
}: Props) {
  const {
    receivedAmount,
    setReceivedAmount,
    changeAmount,
    error,
    loading,
    handleConfirm,
  } = useCashPayment(bookingId, totalAmount, onSuccess);

  const isDisabled = loading || !receivedAmount || parseFloat(receivedAmount) < totalAmount;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>💵 Cash Payment</h3>

      {/* AC01 — Order Summary */}
      <div style={styles.summaryBox}>
        {voucherDiscount > 0 && (
          <div style={styles.row}>
            <span>Applied Voucher</span>
            <span style={styles.discount}>-${voucherDiscount.toFixed(2)}</span>
          </div>
        )}
        {pointDiscount > 0 && (
          <div style={styles.row}>
            <span>Loyalty Points</span>
            <span style={styles.discount}>-${pointDiscount.toFixed(2)}</span>
          </div>
        )}
        <div style={styles.totalRow}>
          <span>Total</span>
          <strong style={styles.totalAmount}>${totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      {/* AC02 — Input tiền nhận */}
      <div style={styles.inputGroup}>
        <label style={styles.label}>Received Amount ($)</label>
        <input
          type="number"
          value={receivedAmount}
          onChange={(e) => setReceivedAmount(e.target.value)}
          placeholder="Enter amount..."
          min={0}
          style={styles.input}
        />
      </div>

      {/* AC02 — Tiền thừa */}
      {receivedAmount && (
        <div style={styles.row}>
          <span>Change</span>
          <strong style={{ color: changeAmount >= 0 ? "#22c55e" : "#ef4444" }}>
            {changeAmount >= 0 ? `$${changeAmount.toFixed(2)}` : "—"}
          </strong>
        </div>
      )}

      {/* AC02 — Error */}
      {error && <p style={styles.error}>⚠️ {error}</p>}

      {/* AC03 — Buttons */}
      <div style={styles.actions}>
        <button onClick={onCancel} style={styles.cancelBtn} disabled={loading}>
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isDisabled}
          style={{
            ...styles.confirmBtn,
            opacity: isDisabled ? 0.5 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : "CONFIRM CHECK OUT"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { background: "#fff", borderRadius: 12, padding: 24, minWidth: 320 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 16 },
  summaryBox: { background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 16 },
  row: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  totalRow: { display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" },
  totalAmount: { fontSize: 22, color: "#1e40af" },
  discount: { color: "#f59e0b" },
  inputGroup: { marginBottom: 12 },
  label: { display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 16 },
  error: { color: "#ef4444", fontSize: 13, marginBottom: 8 },
  actions: { display: "flex", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" },
  confirmBtn: { flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "#1e40af", color: "#fff", fontWeight: 700, transition: "opacity 0.2s" },
};
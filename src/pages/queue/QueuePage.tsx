import { useState } from "react";
import CashPaymentPanel from "../../features/payment/components/CashPaymentPanel";

interface Vehicle {
  id: number;
  bookingId: number;
  licensePlate: string;
  model: string;
  color: string;
  service: string;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "Member" | "Guest";
  finishedAt: string;
  totalAmount: number;
  voucherDiscount?: number;
  pointDiscount?: number;
}

// Mock data theo Figma
const mockCompleted: Vehicle[] = [
  {
    id: 1,
    bookingId: 101,
    licensePlate: "WYZ-1029",
    model: "Mercedes GLC",
    color: "Polar White",
    service: "Premium Package",
    tier: "PLATINUM",
    finishedAt: "14:20",
    totalAmount: 50,
    voucherDiscount: 10,
    pointDiscount: 5,
  },
  {
    id: 2,
    bookingId: 102,
    licensePlate: "KLR-8822",
    model: "Lexus RX",
    color: "Silver",
    service: "Full Detail Package",
    tier: "SILVER",
    finishedAt: "14:35",
    totalAmount: 75,
  },
];

export default function QueuePage() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [paidIds, setPaidIds] = useState<number[]>([]);

  const handleSuccess = (result: any) => {
    if (selectedVehicle) {
      setPaidIds((prev) => [...prev, selectedVehicle.id]);
    }
    setSelectedVehicle(null);
    alert(`✅ Payment successful! Invoice #${result.invoiceId}`);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Live Queue Management</h1>
        <p style={styles.subtitle}>Real-time status of active wash lanes and waiting vehicles.</p>
      </div>

      <div style={styles.layout}>
        {/* Completed Column */}
        <div style={styles.completedCol}>
          <div style={styles.colHeader}>
            <span style={styles.colTitle}>Completed</span>
            <span style={styles.colSub}>AWAITING PAYMENT</span>
          </div>

          {mockCompleted.map((v) => (
            <div
              key={v.id}
              style={{
                ...styles.card,
                opacity: paidIds.includes(v.id) ? 0.4 : 1,
                cursor: paidIds.includes(v.id) ? "default" : "pointer",
              }}
              onClick={() => !paidIds.includes(v.id) && setSelectedVehicle(v)}
            >
              <div style={styles.cardTop}>
                <strong style={styles.plate}>{v.licensePlate}</strong>
                <span style={styles.tier}>{v.tier}</span>
              </div>
              <div style={styles.cardInfo}>
                {v.model} • {v.color}
              </div>
              <div style={styles.cardService}>{v.service}</div>
              <div style={styles.cardFooter}>
                ⏱ Finished: {v.finishedAt}
                {paidIds.includes(v.id) && (
                  <span style={styles.paidBadge}>✅ PAID</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cash Payment Panel — AC01 */}
        {selectedVehicle && (
          <div style={styles.paymentCol}>
            <h3 style={styles.bookingTitle}>
              Booking Details — #{selectedVehicle.licensePlate}
            </h3>
            <p style={styles.bookingInfo}>
              {selectedVehicle.model} • {selectedVehicle.color}
            </p>
            <CashPaymentPanel
              bookingId={selectedVehicle.bookingId}
              totalAmount={selectedVehicle.totalAmount}
              voucherDiscount={selectedVehicle.voucherDiscount}
              pointDiscount={selectedVehicle.pointDiscount}
              onSuccess={handleSuccess}
              onCancel={() => setSelectedVehicle(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, fontFamily: "sans-serif", background: "#f1f5f9", minHeight: "100vh" },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 },
  subtitle: { color: "#64748b", marginTop: 4 },
  layout: { display: "flex", gap: 24, alignItems: "flex-start" },
  completedCol: { background: "#14532d", borderRadius: 12, padding: 16, minWidth: 260 },
  colHeader: { marginBottom: 16 },
  colTitle: { color: "#fff", fontSize: 18, fontWeight: 700, display: "block" },
  colSub: { color: "#86efac", fontSize: 12 },
  card: {
    background: "#fff", borderRadius: 10, padding: 14, marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)", transition: "transform 0.1s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  plate: { fontSize: 16, color: "#1e293b" },
  tier: { fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 99 },
  cardInfo: { fontSize: 13, color: "#475569", marginBottom: 2 },
  cardService: { fontSize: 12, color: "#3b82f6", marginBottom: 6 },
  cardFooter: { fontSize: 12, color: "#94a3b8", display: "flex", justifyContent: "space-between" },
  paidBadge: { background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 99, fontSize: 11 },
  paymentCol: { background: "#fff", borderRadius: 12, padding: 24, flex: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  bookingTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 4px" },
  bookingInfo: { color: "#64748b", marginBottom: 16 },
};
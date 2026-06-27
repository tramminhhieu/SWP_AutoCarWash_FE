//author: Ngọc
//version:2.0.1
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Search, X, ChevronRight, ChevronUp, ChevronDown, Droplets, Check, CreditCard } from "lucide-react";
// author: Ngọc — import API thật
import { scanVehicle, confirmCheckIn, cancelGuestLeft, getQueueData, type ScanVehicleResponse } from "../services/queueApi";
// ported onto dev: dev không có utils/currency.ts, dùng formatCurrency của dev thay formatVND
import { formatCurrency as formatVND } from "../../../utils/format";

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
  // author: Ngọc — bookingType (ADVANCE/WALK_IN/SUBSCRIPTION) từ BE, dùng để
  // phân biệt khách dùng gói Unlimited/Family (SUBSCRIPTION) khi Cancel,
  // KHÔNG dùng tier (loyalty BRONZE/SILVER/GOLD) cho việc này vì 2 khái niệm độc lập
  bookingType?: string | null;
}

interface Lane {
  lane: string;
  plate: string;
  model: string;
  color: string;
  service: string;
  status: "Washing" | "Completed" | "Empty";
  est: string;
  bookingId: number;
  totalAmount: number;
}

interface BookingItem {
  id: number;
  vehicleModel: string;
  licensePlate: string;
  washType: string;
  scheduledTime: string;
  totalAmount: number;
  color: string;
  service: string;
  addOns: { id: number; name: string; price: number }[];
}

interface CustomerResult {
  type: "booked" | "no-booking" | "not-found";
  customerId?: number;
  customerName?: string;
  phone?: string;
  tier?: "PLATINUM" | "GOLD" | "SILVER" | "Member" | "Guest";
  bookings?: BookingItem[];
}

// author: Ngọc — comment out mockCustomerDB vì dùng API thật
// const mockCustomerDB: Record<string, CustomerResult> = { ... };

// author: Ngọc — comment out mock Waiting Pool (bookingId giả 101-105 không tồn tại
// trong DB nên Cancel luôn fail), thay bằng dữ liệu thật từ GET /api/queue
// const initialWaitingPool: Vehicle[] = [
//   { id: 1, bookingId: 101, licensePlate: "LMN-4455", model: "Audi Q7", color: "Metallic Grey", service: "Premium Wash", tier: "PLATINUM", finishedAt: "", totalAmount: 110 },
//   { id: 2, bookingId: 102, licensePlate: "GHI-1122", model: "BMW X5", color: "Alpine White", service: "Deluxe Polish", tier: "GOLD", finishedAt: "", totalAmount: 85 },
//   { id: 3, bookingId: 103, licensePlate: "JKT-3388", model: "Toyota Corolla", color: "Red", service: "Platinum Care", tier: "SILVER", finishedAt: "", totalAmount: 65 },
//   { id: 4, bookingId: 104, licensePlate: "gET-0011", model: "Honda Civic", color: "Black", service: "Basic Rinse", tier: "Member", finishedAt: "", totalAmount: 30 },
//   { id: 5, bookingId: 105, licensePlate: "MSu-2299", model: "Mazda CX-5", color: "Soul Red", service: "Express Clean", tier: "Guest", finishedAt: "", totalAmount: 45 },
// ];

// author: Ngọc — map customerTier từ BE ("MEMBER"/"GOLD"/"SILVER"/"PLATINUM"/null)
// sang giá trị tier mà UI đang dùng để tô màu badge (tierBadge)
const mapTier = (tier: string | null): Vehicle["tier"] => {
  if (!tier) return "Guest"; // không có customer (khách lẻ/anonymous) -> Guest
  if (tier === "MEMBER") return "Member";
  return tier as "PLATINUM" | "GOLD" | "SILVER";
};

// author: Ngọc — số lane tối thiểu luôn hiển thị (pad bằng Empty nếu IN_SERVICE ít hơn)
const MIN_LANES = 3;

const makeEmptyLane = (index: number): Lane => ({
  lane: String(index + 1).padStart(2, "0"),
  plate: "—",
  model: "",
  color: "",
  service: "",
  status: "Empty",
  est: "",
  bookingId: 0,
  totalAmount: 0,
});

const tierBadge: Record<string, string> = {
  PLATINUM: "bg-primary-fixed text-on-primary-fixed",
  GOLD: "bg-secondary-fixed text-on-secondary-fixed",
  SILVER: "bg-surface-variant text-on-surface-variant",
  Member: "bg-surface-container text-primary",
  Guest: "bg-surface-container-low text-on-surface-variant",
};

export default function QueuePage() {
  const navigate = useNavigate();
  const [lanes, setLanes] = useState<Lane[]>(
    Array.from({ length: MIN_LANES }, (_, i) => makeEmptyLane(i))
  );
  // author: Ngọc — Waiting Pool bắt đầu rỗng, load thật từ API qua useEffect dưới
  const [waitingPool, setWaitingPool] = useState<Vehicle[]>([]);
  const [completed, setCompleted] = useState<Vehicle[]>([]);
  const [cancelVehicle, setCancelVehicle] = useState<Vehicle | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [searchResult, setSearchResult] = useState<CustomerResult | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [isSearched, setIsSearched] = useState(false);
  // author: Ngọc — thêm state cho API thật
  const [scanResult, setScanResult] = useState<ScanVehicleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // author: Ngọc — load toàn bộ queue thật từ GET /api/queue khi vào trang,
  // group theo status để đổ vào cả 3 cột (Active Lanes / Waiting Pool / Completed)
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const data = await getQueueData();

        // Waiting Pool: status WAITING
        const waiting: Vehicle[] = data.waitingPool
          .filter((t) => t.bookingId !== null)
          .map((t) => ({
            id: t.id,
            bookingId: t.bookingId as number,
            licensePlate: t.licensePlate ?? "—",
            model: t.vehicleBrand ?? "",
            color: t.vehicleColor ?? "",
            service: t.serviceName ?? "",
            tier: mapTier(t.customerTier),
            finishedAt: "",
            // ghi chú: QueueTicketResponse bên BE chưa có field totalAmount,
            // cần xin Bình bổ sung nếu muốn hiện đúng số tiền ở Cancel modal
            totalAmount: 0,
          }));
        setWaitingPool(waiting);

        // Active Lanes: status IN_SERVICE, pad đến MIN_LANES bằng Empty
        const activeLanes: Lane[] = data.activeLanes.map((t, idx) => ({
          lane: String(idx + 1).padStart(2, "0"),
          plate: t.licensePlate ?? "—",
          model: t.vehicleBrand ?? "",
          color: t.vehicleColor ?? "",
          service: t.serviceName ?? "",
          status: "Washing" as const,
          est: "",
          bookingId: t.bookingId ?? 0,
          totalAmount: 0,
        }));
        const totalSlots = Math.max(MIN_LANES, activeLanes.length);
        const paddedLanes: Lane[] = [
          ...activeLanes,
          ...Array.from({ length: totalSlots - activeLanes.length }, (_, i) =>
            makeEmptyLane(activeLanes.length + i)
          ),
        ];
        setLanes(paddedLanes);

        // Completed: status COMPLETED
        const done: Vehicle[] = data.completed
          .filter((t) => t.bookingId !== null)
          .map((t) => ({
            id: t.id,
            bookingId: t.bookingId as number,
            licensePlate: t.licensePlate ?? "—",
            model: t.vehicleBrand ?? "",
            color: t.vehicleColor ?? "",
            service: t.serviceName ?? "",
            tier: mapTier(t.customerTier),
            finishedAt: "",
            totalAmount: 0,
          }));
        setCompleted(done);
      } catch {
        // load lỗi thì giữ state ban đầu, không chặn UI
      }
    };
    loadQueue();
  }, []);

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
  const hasEmptyLane = lanes.some((l) => l.status === "Empty");

  const closeCheckinModal = () => {
    setShowCheckin(false);
    setSearchPlate("");
    setSearchResult(null);
    // author: Ngọc — reset scanResult khi đóng modal
    setScanResult(null);
    setSelectedBooking(null);
    setIsSearched(false);
  };

  // author: Ngọc — đổi từ mock sang gọi API thật
  // const handleSearch = () => {
  //   if (!searchPlate.trim()) return;
  //   setIsSearched(true);
  //   setSelectedBooking(null);
  //   const found = Object.entries(mockCustomerDB).find(([plate]) =>
  //     plate.toLowerCase().includes(searchPlate.toLowerCase())
  //   );
  //   setSearchResult(found ? found[1] : { type: "not-found" });
  // };
  const handleSearch = async () => {
    if (!searchPlate.trim()) return;
    setIsLoading(true);
    setIsSearched(true);
    setSelectedBooking(null);
    try {
      const result = await scanVehicle(searchPlate);
      setScanResult(result);
      if (result.hasBooking) {
        setSearchResult({
          type: "booked",
          customerName: result.customerName ?? "",
          tier: mapTier(result.customerTier),
          bookings: [{
            id: result.bookingId!,
            vehicleModel: result.brandName ?? searchPlate,
            licensePlate: searchPlate,
            washType: result.serviceName ?? "",
            scheduledTime: `${result.slotStartTime} - ${result.slotEndTime}`,
            totalAmount: result.totalAmount ?? 0,
            color: result.color ?? "",
            service: result.serviceName ?? "",
            addOns: [],
          }],
        });
      } else {
        setSearchResult({ type: "not-found" });
      }
    } catch {
      setSearchResult({ type: "not-found" });
    } finally {
      setIsLoading(false);
    }
  };

  // author: Ngọc — đổi từ mock sang gọi API confirm check-in thật
  // const handleConfirmCheckIn = () => {
  //   if (!selectedBooking || !searchResult) return;
  //   const newVehicle: Vehicle = { ... };
  //   setWaitingPool((prev) => [...prev, newVehicle]);
  //   closeCheckinModal();
  // };
  const handleConfirmCheckIn = async () => {
    if (!selectedBooking || !scanResult?.bookingId) return;
    setIsLoading(true);
    try {
      const result = await confirmCheckIn(scanResult.bookingId);
      if (result.requiresWalkIn) {
        closeCheckinModal();
        navigate("/staff/walk-in", { state: { oldBookingId: result.oldBookingId } });
        return;
      }
      const newVehicle: Vehicle = {
        id: Date.now(),
        bookingId: selectedBooking.id,
        licensePlate: selectedBooking.licensePlate,
        model: selectedBooking.vehicleModel,
        color: selectedBooking.color,
        service: selectedBooking.service,
        tier: searchResult?.tier ?? "Guest",
        finishedAt: "",
        totalAmount: selectedBooking.totalAmount,
        // author: Ngọc — lưu bookingType từ scan result để modal Cancel phân biệt đúng
        bookingType: scanResult.bookingType,
      };
      setWaitingPool((prev) => [...prev, newVehicle]);
      closeCheckinModal();
    } catch {
      alert("Check-in thất bại, thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const moveVehicle = (index: number, dir: -1 | 1) => {
    setWaitingPool((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleAddToLane = () => {
    if (waitingPool.length === 0) return;
    const emptyIndex = lanes.findIndex((l) => l.status === "Empty");
    if (emptyIndex === -1) return;
    const next = waitingPool[0];
    setLanes((prev) =>
      prev.map((l, i) =>
        i === emptyIndex
          ? { ...l, plate: next.licensePlate, model: next.model, color: next.color, service: next.service, status: "Washing", est: "20 mins left", bookingId: next.bookingId, totalAmount: next.totalAmount }
          : l
      )
    );
    setWaitingPool((prev) => prev.slice(1));
  };

  const handleCompleted = (index: number) => {
    const lane = lanes[index];
    const newCompleted: Vehicle = {
      id: Date.now(),
      bookingId: lane.bookingId,
      licensePlate: lane.plate,
      model: lane.model,
      color: lane.color,
      service: lane.service,
      tier: "Guest",
      finishedAt: timeStr,
      totalAmount: lane.totalAmount,
    };
    setCompleted((prev) => [...prev, newCompleted]);
    const updatedLanes = [...lanes];
    if (waitingPool.length > 0) {
      const next = waitingPool[0];
      updatedLanes[index] = { ...updatedLanes[index], plate: next.licensePlate, model: next.model, color: next.color, service: next.service, status: "Washing", est: "20 mins left", bookingId: next.bookingId, totalAmount: next.totalAmount };
      setWaitingPool((prev) => prev.slice(1));
    } else {
      updatedLanes[index] = makeEmptyLane(index);
    }
    setLanes(updatedLanes);
  };

  // gọi API cancel guest left
  const handleConfirmCancel = async () => {
    if (!cancelVehicle) return;
    setIsLoading(true);
    try {
      await cancelGuestLeft(cancelVehicle.bookingId);
      setWaitingPool((prev) => prev.filter((v) => v.id !== cancelVehicle.id));
      setCancelVehicle(null);
    } catch {
      alert("Huỷ booking thất bại, thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompleted = (v: Vehicle) => {
    navigate(`/staff/payment/${v.bookingId}`, {
      state: { bookingId: v.bookingId, licensePlate: v.licensePlate, model: v.model, color: v.color, service: v.service, totalAmount: v.totalAmount, voucherDiscount: v.voucherDiscount, pointDiscount: v.pointDiscount },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-on-background">Live Queue Management</h1>
          <p className="text-sm mt-1 text-on-surface-variant">Real-time status of active wash lanes and waiting vehicles.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCheckin(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition bg-primary text-on-primary hover:opacity-90">
            + Check-in
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Active Lanes */}
        <div className="w-90 shrink-0">
          <p className="text-xs font-semibold uppercase mb-3 text-outline">Active Lanes</p>
          <div className="flex flex-col gap-3">
            {lanes.map((lane, index) => (
              <div key={lane.lane} className="rounded-2xl p-3 flex items-center gap-3 bg-white shadow-sm border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-primary text-on-primary">
                  <span className="text-[10px] font-medium leading-none">LANE</span>
                  <span className="text-base font-bold leading-tight">{lane.lane}</span>
                </div>
                {lane.status === "Empty" ? (
                  <div className="flex-1">
                    <p className="text-xs italic text-outline">No vehicle assigned</p>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${lane.status === "Washing" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {lane.status === "Washing" ? <Droplets className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                        {lane.status}
                      </span>
                      <span className="text-[11px] text-outline truncate">{lane.model.split(" ")[0]} • {lane.color}</span>
                    </div>
                    <p className="text-base font-bold text-on-surface tracking-wide">{lane.plate}</p>
                    <p className="text-[11px] font-medium text-primary truncate">{lane.service}</p>
                  </div>
                )}
                {lane.status !== "Empty" && (
                  <button onClick={() => handleCompleted(index)} className="px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 bg-primary text-on-primary hover:opacity-90">
                    Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Waiting Pool */}
        <div className="flex-1">
          <div className="rounded-t-2xl px-4 py-3 flex items-center justify-between bg-primary">
            <div>
              <p className="font-bold text-sm text-white">Waiting Pool</p>
              <p className="text-xs text-white/70">{waitingPool.length} VEHICLES IN QUEUE</p>
            </div>
            <button
              onClick={handleAddToLane}
              disabled={!hasEmptyLane || waitingPool.length === 0}
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >+</button>
          </div>
          <div className="rounded-b-2xl p-2.5 flex flex-col gap-2 bg-surface-container-lowest shadow-sm">
            {waitingPool.length === 0 && (
              <p className="text-xs text-center py-4 text-outline">No vehicles waiting</p>
            )}
            {waitingPool.map((v, idx) => (
              <div key={v.id} className="rounded-xl px-3 py-2.5 flex items-center gap-2 bg-white border border-outline-variant/20">
                <div className="flex flex-col justify-center gap-0.5 shrink-0">
                  <button onClick={() => moveVehicle(idx, -1)} disabled={idx === 0} className="text-outline transition hover:text-primary disabled:opacity-30">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveVehicle(idx, 1)} disabled={idx === waitingPool.length - 1} className="text-outline transition hover:text-primary disabled:opacity-30">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-on-surface">{v.licensePlate}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tierBadge[v.tier]}`}>{v.tier}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate">{v.model.split(" ")[0]} • {v.color}</p>
                  <p className="text-[11px] font-medium text-primary flex items-center gap-0.5">
                    <Droplets className="w-2.5 h-2.5 shrink-0" /> {v.service}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setCancelVehicle(v); }}
                  className="text-xs px-4 py-1.5 rounded-full font-medium whitespace-nowrap bg-error-container text-on-error-container shrink-0"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Completed */}
        <div className="flex-1">
          <div className="rounded-t-2xl px-4 py-3 flex items-center justify-between bg-tertiary-container">
            <div>
              <p className="font-bold text-sm text-white">Completed</p>
              <p className="text-xs text-white/70">AWAITING PAYMENT</p>
            </div>
            <CreditCard className="w-4 h-4 text-white/80" />
          </div>
          <div className="rounded-b-2xl p-2.5 flex flex-col gap-2 bg-surface-container-lowest shadow-sm">
            {completed.length === 0 && (
              <p className="text-xs text-center py-4 text-outline">No completed vehicles</p>
            )}
            {completed.map((v) => (
              <div key={v.id} onClick={() => handleSelectCompleted(v)} className="rounded-xl px-3 py-2.5 cursor-pointer transition hover:bg-surface-container-low bg-white border border-outline-variant/20">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-on-surface">{v.licensePlate}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tierBadge[v.tier]}`}>{v.tier}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">{v.model.split(" ")[0]} • {v.color}</p>
                <p className="text-[11px] font-medium text-primary">{v.service}</p>
                <div className="flex justify-end mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckin && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-inverse-surface/50" onClick={closeCheckinModal}>
          <div className="rounded-2xl shadow-xl w-full max-w-lg mx-4 bg-surface-container-lowest" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
              <h2 className="text-base font-bold font-heading text-on-surface">Vehicle Check-in</h2>
              <button onClick={closeCheckinModal} className="rounded-full p-1 hover:bg-surface-container transition">
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="flex gap-2 mb-4">
                <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2 border border-outline-variant">
                  <Search className="w-4 h-4 shrink-0 text-outline" />
                  <input
                    type="text"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Enter license plate..."
                    className="flex-1 text-sm outline-none bg-transparent text-on-surface"
                    autoFocus
                  />
                  {searchPlate && (
                    <button onClick={() => { setSearchPlate(""); setSearchResult(null); setIsSearched(false); setScanResult(null); }}>
                      <X className="w-4 h-4 text-outline" />
                    </button>
                  )}
                </div>
                <button onClick={handleSearch} disabled={isLoading} className="px-4 py-2 rounded-xl text-sm font-semibold transition bg-primary text-on-primary disabled:opacity-50">
                  {isLoading ? "..." : "Search"}
                </button>
              </div>

              {!isSearched && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-surface-container">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-on-surface">Search for a customer</p>
                  <p className="text-xs mt-1 text-outline">Enter license plate to find booking</p>
                </div>
              )}

              {isSearched && searchResult?.type === "not-found" && (
                <div className="py-4">
                  <div className="rounded-xl p-4 mb-4 bg-error-container border border-error">
                    <p className="text-sm font-semibold text-on-error-container">No booking found</p>
                    <p className="text-xs mt-1 text-on-error-container">No booking found for "{searchPlate}" today.</p>
                  </div>
                  <button onClick={() => { closeCheckinModal(); navigate("/staff/walk-in"); }} className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary">+ Create Walk-in</button>
                </div>
              )}

              {isSearched && searchResult?.type === "booked" && (
                <div className="py-2">
                  {scanResult?.vehiclePenalized && (
                    <div className="rounded-xl px-4 py-3 mb-3 bg-error-container border border-error">
                      <p className="text-xs font-semibold text-on-error-container">Xe bị hạn chế</p>
                      <p className="text-xs text-on-error-container mt-0.5">Xe này có vi phạm. Cần thu cọc phạt 20,000đ trước khi check-in.</p>
                    </div>
                  )}
                  <div className="rounded-xl p-3 mb-3 bg-surface-container-low">
                    <p className="font-bold text-sm text-on-surface">{searchResult.customerName}</p>
                    {scanResult && (
                      <p className="text-xs text-outline mt-0.5">
                        {scanResult.serviceName && <span className="text-primary font-medium">{scanResult.serviceName} • </span>}
                        Slot: {scanResult.slotStartTime} - {scanResult.slotEndTime}
                        {scanResult.totalAmount != null && scanResult.totalAmount > 0 && (
                          <span> • {formatVND(scanResult.totalAmount!)}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase mb-2 text-outline">Select Booking</p>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
                    {searchResult.bookings?.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`rounded-xl p-3 cursor-pointer transition border-2 ${selectedBooking?.id === b.id ? "border-primary bg-primary-fixed" : "border-outline-variant bg-surface-container-lowest"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{b.licensePlate}</p>
                            <p className="text-xs font-medium mt-1 text-primary">{b.scheduledTime}</p>
                          </div>
                          <p className="text-sm font-bold text-on-surface">#{b.id}</p>
                        </div>
                        {selectedBooking?.id === b.id && (
                          <div className="flex items-center gap-1 mt-2 text-primary">
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-xs font-medium">Selected</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirmCheckIn}
                    disabled={!selectedBooking || isLoading}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Đang xử lý..." : "Confirm Check-in"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelVehicle && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-inverse-surface/50" onClick={() => setCancelVehicle(null)}>
          <div className="rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 bg-surface-container-lowest" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-heading text-on-surface">Cancel Booking</h2>
              <button onClick={() => setCancelVehicle(null)} className="rounded-full p-1 hover:bg-surface-container transition">
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            <div className="rounded-2xl p-5 mb-4 bg-surface-container-low border border-outline-variant">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-on-surface tracking-wide">{cancelVehicle.licensePlate}</p>
                  <p className="text-sm text-on-surface mt-0.5">{cancelVehicle.model} • {cancelVehicle.color}</p>
                  <p className="text-sm font-semibold text-primary mt-1">{cancelVehicle.service}</p>
                  <p className="text-sm font-bold text-on-surface mt-1">{formatVND(cancelVehicle.totalAmount)}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${tierBadge[cancelVehicle.tier]}`}>
                  {cancelVehicle.tier}
                </span>
              </div>
            </div>
            {cancelVehicle.tier === "Guest" ? (
              <div className="rounded-xl px-4 py-3 mb-4 bg-error-container border border-error">
                <p className="text-xs font-semibold mb-0.5 text-on-error-container">Walk-in Cancellation</p>
                <p className="text-xs text-on-error-container">1 violation point will be added to <strong>{cancelVehicle.licensePlate}</strong>.</p>
              </div>
            ) : cancelVehicle.bookingType === "SUBSCRIPTION" ? (
              <div className="rounded-xl px-4 py-3 mb-4 bg-secondary-fixed border border-secondary">
                <p className="text-xs font-semibold mb-0.5 text-on-secondary-fixed">Unlimited / Family Package</p>
                <p className="text-xs text-on-secondary-fixed-variant">No deposit collected. 1 violation point added.</p>
              </div>
            ) : (
              <div className="rounded-xl px-4 py-3 mb-4 bg-error-container border border-error">
                <p className="text-xs font-semibold mb-0.5 text-on-error-container">Single Package — Deposit Required</p>
                <p className="text-xs text-on-error-container">100% of the deposit amount will be collected.</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setCancelVehicle(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-outline-variant text-on-surface-variant bg-surface-container-lowest">
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-error text-on-error disabled:opacity-50"
              >
                {isLoading ? "Đang xử lý..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/*
 * @author: Bảo Ngọc
 * @version 2.0
 */
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, X, ChevronRight } from "lucide-react";

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

// Mock data
const mockCustomerDB: Record<string, CustomerResult> = {
  "ABC-1234": {
    type: "booked",
    customerId: 1,
    customerName: "Robert Pattinson",
    phone: "+1 (555) 000-1234",
    tier: "PLATINUM",
    bookings: [
      {
        id: 401,
        vehicleModel: "Tesla Model S",
        licensePlate: "ABC-1234",
        washType: "Deluxe Wash",
        scheduledTime: "10:30 AM",
        totalAmount: 80,
        color: "Black",
        service: "Deluxe Wash",
        addOns: [
          { id: 1, name: "Interior Vacuum", price: 15 },
          { id: 2, name: "Tire Shine", price: 10 },
        ],
      },
      {
        id: 402,
        vehicleModel: "BMW X5",
        licensePlate: "ABC-5678",
        washType: "Interior Detail",
        scheduledTime: "1:45 PM",
        totalAmount: 120,
        color: "White",
        service: "Interior Detail",
        addOns: [],
      },
    ],
  },
  "XYZ-9999": {
    type: "no-booking",
    customerId: 2,
    customerName: "Jane Smith",
    phone: "+1 (555) 999-8888",
    tier: "Member",
    bookings: [],
  },
};

const initialWaitingPool: Vehicle[] = [
  { id: 1, bookingId: 101, licensePlate: "LMN-4455", model: "Audi Q7", color: "Metallic Grey", service: "Premium Wash", tier: "PLATINUM", finishedAt: "", totalAmount: 110 },
  { id: 2, bookingId: 102, licensePlate: "GHI-1122", model: "BMW X5", color: "Alpine White", service: "Deluxe Polish", tier: "GOLD", finishedAt: "", totalAmount: 85 },
  { id: 3, bookingId: 103, licensePlate: "JKT-3388", model: "Toyota Corolla", color: "Red", service: "Platinum Care", tier: "SILVER", finishedAt: "", totalAmount: 65 },
  { id: 4, bookingId: 104, licensePlate: "gET-0011", model: "Honda Civic", color: "Black", service: "Basic Rinse", tier: "Member", finishedAt: "", totalAmount: 30 },
  { id: 5, bookingId: 105, licensePlate: "MSu-2299", model: "Mazda CX-5", color: "Soul Red", service: "Express Clean", tier: "Guest", finishedAt: "", totalAmount: 45 },
];

const initialLanes: Lane[] = [
  { lane: "01", plate: "ABC-1234", model: "Tesla Model 3", color: "Blue", service: "Deluxe Ceramic Wash", status: "Washing", est: "4 mins left", bookingId: 301, totalAmount: 60 },
  { lane: "02", plate: "WASH-888", model: "BMW X5", color: "Alpine White", service: "Full Detail Package", status: "Washing", est: "12 mins left", bookingId: 302, totalAmount: 90 },
  { lane: "03", plate: "ABC-1234", model: "Tesla Model 3", color: "Blue", service: "Deluxe Ceramic Wash", status: "Washing", est: "4 mins left", bookingId: 303, totalAmount: 60 },
];

const initialCompleted: Vehicle[] = [
  { id: 6, bookingId: 201, licensePlate: "WYZ-1029", model: "Mercedes GLC", color: "Polar White", service: "Premium Package", tier: "PLATINUM", finishedAt: "14:20", totalAmount: 50, voucherDiscount: 10, pointDiscount: 5 },
  { id: 7, bookingId: 202, licensePlate: "KLR-8822", model: "Lexus RX", color: "Silver", service: "Full Detail Package", tier: "SILVER", finishedAt: "14:35", totalAmount: 75 },
];

const tierColors: Record<string, string> = {
  PLATINUM: "bg-[#dce1ff] text-[#001551]",
  GOLD: "bg-[#c9e6ff] text-[#001e2f]",
  SILVER: "bg-[#dce2f7] text-[#434655]",
  Member: "bg-[#e9edff] text-[#0037b0]",
  Guest: "bg-[#f1f3ff] text-[#434655]",
};

export default function QueuePage() {
  const navigate = useNavigate();
  const [lanes, setLanes] = useState<Lane[]>(initialLanes);
  const [waitingPool, setWaitingPool] = useState<Vehicle[]>(initialWaitingPool);
  const [completed, setCompleted] = useState<Vehicle[]>(initialCompleted);

  // Check-in modal
  const [showCheckin, setShowCheckin] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [searchResult, setSearchResult] = useState<CustomerResult | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [isSearched, setIsSearched] = useState(false);

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  const closeModal = () => {
    setShowCheckin(false);
    setSearchPlate("");
    setSearchResult(null);
    setSelectedBooking(null);
    setIsSearched(false);
  };

  const handleSearch = () => {
    if (!searchPlate.trim()) return;
    setIsSearched(true);
    setSelectedBooking(null);

    const found = Object.entries(mockCustomerDB).find(([plate]) =>
      plate.toLowerCase().includes(searchPlate.toLowerCase())
    );

    if (found) {
      setSearchResult(found[1]);
    } else {
      setSearchResult({ type: "not-found" });
    }
  };

  const handleConfirmCheckIn = () => {
    if (!selectedBooking || !searchResult) return;

    const newVehicle: Vehicle = {
      id: Date.now(),
      bookingId: selectedBooking.id,
      licensePlate: selectedBooking.licensePlate,
      model: selectedBooking.vehicleModel,
      color: selectedBooking.color,
      service: selectedBooking.service,
      tier: searchResult.tier ?? "Guest",
      finishedAt: "",
      totalAmount: selectedBooking.totalAmount,
    };
    setWaitingPool((prev) => [...prev, newVehicle]);
    closeModal();
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
      updatedLanes[index] = {
        ...updatedLanes[index],
        plate: next.licensePlate,
        model: next.model,
        color: next.color,
        service: next.service,
        status: "Washing",
        est: "20 mins left",
        bookingId: next.bookingId,
        totalAmount: next.totalAmount,
      };
      setWaitingPool((prev) => prev.slice(1));
    } else {
      updatedLanes[index] = {
        ...updatedLanes[index],
        plate: "—",
        model: "",
        color: "",
        service: "",
        status: "Empty",
        est: "",
        bookingId: 0,
        totalAmount: 0,
      };
    }
    setLanes(updatedLanes);
  };

  const handleSelectCompleted = (v: Vehicle) => {
    navigate(`/staff/payment/${v.bookingId}`, {
      state: {
        bookingId: v.bookingId,
        licensePlate: v.licensePlate,
        model: v.model,
        color: v.color,
        service: v.service,
        totalAmount: v.totalAmount,
        voucherDiscount: v.voucherDiscount,
        pointDiscount: v.pointDiscount,
      },
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#f9f9ff" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#141b2b", fontFamily: "Montserrat, sans-serif" }}>
            Live Queue Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "#434655" }}>
            Real-time status of active wash lanes and waiting vehicles.
          </p>
        </div>
        <button
          onClick={() => setShowCheckin(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition"
          style={{ background: "#0037b0", color: "#ffffff" }}
        >
          + Check-in
        </button>
      </div>

      <div className="flex gap-4">
        {/* Active Lanes */}
        <div className="w-96 shrink-0">
          <p className="text-xs font-semibold uppercase mb-3" style={{ color: "#747686" }}>Active Lanes</p>
          <div className="flex flex-col gap-3">
            {lanes.map((lane, index) => (
              <div
                key={lane.lane}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: "#0037b0", color: "#ffffff" }}
                >
                  <span className="text-xs font-medium">LANE</span>
                  <span className="text-lg font-bold">{lane.lane}</span>
                </div>
                {lane.status === "Empty" ? (
                  <div className="flex-1">
                    <p className="text-sm italic" style={{ color: "#747686" }}>No vehicle assigned</p>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={lane.status === "Washing"
                          ? { background: "#c9e6ff", color: "#004c6e" }
                          : { background: "#4ae176", color: "#002109" }}
                      >
                        {lane.status}
                      </span>
                      <span className="text-xs" style={{ color: "#747686" }}>{lane.model} • {lane.color}</span>
                    </div>
                    <p className="text-lg font-bold" style={{ color: "#141b2b" }}>{lane.plate}</p>
                    <p className="text-xs font-medium" style={{ color: "#0037b0" }}>{lane.service}</p>
                    <p className="text-xs" style={{ color: "#747686" }}>Est: {lane.est}</p>
                  </div>
                )}
                {lane.status !== "Empty" && (
                  <button
                    onClick={() => handleCompleted(index)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0"
                    style={{ background: "#006b2d", color: "#ffffff" }}
                  >
                    Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Waiting Pool */}
        <div className="flex-1">
          <div className="rounded-2xl p-4 h-full" style={{ background: "#0037b0" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-sm" style={{ color: "#ffffff" }}>Waiting Pool</p>
                <p className="text-xs" style={{ color: "#b7c4ff" }}>{waitingPool.length} VEHICLES IN QUEUE</p>
              </div>
              <button
                onClick={() => setShowCheckin(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff" }}
              >+</button>
            </div>
            <div className="flex flex-col gap-2">
              {waitingPool.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: "#b7c4ff" }}>No vehicles waiting</p>
              )}
              {waitingPool.map((v) => (
                <div key={v.id} className="rounded-xl p-3" style={{ background: "#ffffff" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs" style={{ color: "#141b2b" }}>{v.licensePlate}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tierColors[v.tier]}`}>{v.tier}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#434655" }}>{v.model} • {v.color}</p>
                  <p className="text-xs font-medium" style={{ color: "#0037b0" }}>{v.service}</p>
                  <div className="mt-2 w-full text-xs py-1 rounded-lg font-medium text-center" style={{ background: "#0037b0", color: "#ffffff" }}>
                    Checked In
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="flex-1">
          <div className="rounded-2xl p-4 h-full" style={{ background: "#006b2d" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-sm" style={{ color: "#ffffff" }}>Completed</p>
                <p className="text-xs" style={{ color: "#5cf083" }}>AWAITING PAYMENT</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {completed.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleSelectCompleted(v)}
                  className="rounded-xl p-3 cursor-pointer transition hover:opacity-90"
                  style={{ background: "#ffffff" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs" style={{ color: "#141b2b" }}>{v.licensePlate}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tierColors[v.tier]}`}>{v.tier}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#434655" }}>{v.model} • {v.color}</p>
                  <p className="text-xs font-medium" style={{ color: "#0037b0" }}>{v.service}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: "#747686" }}>⏱ {v.finishedAt}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#4ae176", color: "#002109" }}>
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckin && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(20,27,43,0.5)" }}
          onClick={closeModal}
        >
          <div
            className="rounded-2xl shadow-xl w-full max-w-lg mx-4"
            style={{ background: "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #dce2f7" }}>
              <h2 className="text-base font-bold" style={{ color: "#141b2b", fontFamily: "Montserrat, sans-serif" }}>
                Vehicle Check-in
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-slate-100 transition">
                <X className="w-5 h-5" style={{ color: "#747686" }} />
              </button>
            </div>

            <div className="px-6 py-4">
              {/* Search bar */}
              <div className="flex gap-2 mb-4">
                <div
                  className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2"
                  style={{ border: "1px solid #c4c5d7" }}
                >
                  <Search className="w-4 h-4 shrink-0" style={{ color: "#747686" }} />
                  <input
                    type="text"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Enter license plate or phone..."
                    className="flex-1 text-sm outline-none"
                    style={{ color: "#141b2b" }}
                    autoFocus
                  />
                  {searchPlate && (
                    <button onClick={() => { setSearchPlate(""); setSearchResult(null); setIsSearched(false); }}>
                      <X className="w-4 h-4" style={{ color: "#747686" }} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition"
                  style={{ background: "#0037b0", color: "#ffffff" }}
                >
                  Search
                </button>
              </div>

              {/* Default — chưa search */}
              {!isSearched && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#e9edff" }}>
                    <Search className="w-6 h-6" style={{ color: "#0037b0" }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#141b2b" }}>Search for a customer</p>
                  <p className="text-xs mt-1" style={{ color: "#747686" }}>Enter license plate or phone number to find booking</p>
                </div>
              )}

              {/* TH1 — Không tìm thấy (khách vãng lai) */}
              {isSearched && searchResult?.type === "not-found" && (
                <div className="py-4">
                  <div
                    className="rounded-xl p-4 mb-4 flex items-start gap-3"
                    style={{ background: "#ffdad6", border: "1px solid #ba1a1a" }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#93000a" }}>
                        No customer found
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#93000a" }}>
                        No account found for "{searchPlate}". This customer will be treated as a walk-in guest.
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-full py-3 rounded-xl text-sm font-semibold transition"
                    style={{ background: "#0037b0", color: "#ffffff" }}
                  >
                    + Create Walk-in
                  </button>
                </div>
              )}

              {/* TH2 — Có khách nhưng chưa booking */}
              {isSearched && searchResult?.type === "no-booking" && (
                <div className="py-2">
                  {/* Customer info */}
                  <div className="rounded-xl p-4 mb-4" style={{ background: "#f1f3ff" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#141b2b" }}>{searchResult.customerName}</p>
                        <p className="text-xs" style={{ color: "#747686" }}>{searchResult.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[searchResult.tier ?? "Guest"]}`}>
                        {searchResult.tier}
                      </span>
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{ background: "#c9e6ff", border: "1px solid #006591" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "#001e2f" }}>No upcoming bookings</p>
                    <p className="text-xs mt-1" style={{ color: "#004c6e" }}>
                      This customer has no scheduled appointment today. You can create a walk-in service for them.
                    </p>
                  </div>
                  <button
                    className="w-full py-3 rounded-xl text-sm font-semibold transition"
                    style={{ background: "#0037b0", color: "#ffffff" }}
                  >
                    + Create Walk-in for {searchResult.customerName}
                  </button>
                </div>
              )}

              {/* TH3 — Có booking */}
              {isSearched && searchResult?.type === "booked" && (
                <div className="py-2">
                  {/* Customer info */}
                  <div className="rounded-xl p-3 mb-3" style={{ background: "#f1f3ff" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#141b2b" }}>{searchResult.customerName}</p>
                        <p className="text-xs" style={{ color: "#747686" }}>{searchResult.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[searchResult.tier ?? "Guest"]}`}>
                        {searchResult.tier}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#747686" }}>
                    Select Booking Slot
                  </p>

                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
                    {searchResult.bookings?.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className="rounded-xl p-3 cursor-pointer transition"
                        style={{
                          background: selectedBooking?.id === b.id ? "#dce1ff" : "#ffffff",
                          border: selectedBooking?.id === b.id ? "2px solid #0037b0" : "2px solid #dce2f7",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#141b2b" }}>{b.vehicleModel}</p>
                            <p className="text-xs" style={{ color: "#747686" }}>{b.licensePlate} • {b.color}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: "#0037b0" }}>{b.washType}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs" style={{ color: "#747686" }}>Scheduled</p>
                            <p className="text-sm font-bold" style={{ color: "#141b2b" }}>{b.scheduledTime}</p>
                            <p className="text-xs font-semibold mt-1" style={{ color: "#0037b0" }}>${b.totalAmount}</p>
                          </div>
                        </div>
                        {b.addOns.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {b.addOns.map((a) => (
                              <span key={a.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#e9edff", color: "#0037b0" }}>
                                {a.name} +${a.price}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedBooking?.id === b.id && (
                          <div className="flex items-center gap-1 mt-2" style={{ color: "#0037b0" }}>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-xs font-medium">Selected</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmCheckIn}
                    disabled={!selectedBooking}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition"
                    style={{
                      background: "#0037b0",
                      color: "#ffffff",
                      opacity: !selectedBooking ? 0.5 : 1,
                      cursor: !selectedBooking ? "not-allowed" : "pointer",
                    }}
                  >
                    Confirm Check-in
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
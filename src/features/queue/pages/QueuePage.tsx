/*@author: Bảo Ngọc 
 @version 1.0
*/
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
  time: string;
  totalAmount: number;
  color: string;
  service: string;
}

interface CustomerBooking {
  licensePlate: string;
  customerName: string;
  phone: string;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "Member" | "Guest";
  bookings: BookingItem[];
}

const allBookings: CustomerBooking[] = [
  {
    licensePlate: "ABC-1234",
    customerName: "Robert Pattinson",
    phone: "+1 (555) 000-1234",
    tier: "PLATINUM",
    bookings: [
      { id: 401, vehicleModel: "Tesla Model S", licensePlate: "ABC-1234", washType: "Deluxe Wash", time: "10:30 AM", totalAmount: 80, color: "Black", service: "Deluxe Wash" },
      { id: 402, vehicleModel: "BMW X5", licensePlate: "ABC-5678", washType: "Interior Detail", time: "1:45 PM", totalAmount: 120, color: "White", service: "Interior Detail" },
    ],
  },
  {
    licensePlate: "LMN-4455",
    customerName: "Jordan Davis",
    phone: "+1 (555) 111-2222",
    tier: "GOLD",
    bookings: [
      { id: 403, vehicleModel: "Audi Q7", licensePlate: "LMN-4455", washType: "Premium Wash", time: "11:00 AM", totalAmount: 110, color: "Metallic Grey", service: "Premium Wash" },
    ],
  },
  {
    licensePlate: "JKT-3388",
    customerName: "Sarah Connor",
    phone: "+1 (555) 333-4444",
    tier: "SILVER",
    bookings: [
      { id: 404, vehicleModel: "Toyota Corolla", licensePlate: "JKT-3388", washType: "Platinum Care", time: "2:00 PM", totalAmount: 65, color: "Red", service: "Platinum Care" },
    ],
  },
  {
    licensePlate: "MSu-2299",
    customerName: "Emily Brown",
    phone: "+1 (555) 555-6666",
    tier: "Member",
    bookings: [
      { id: 405, vehicleModel: "Mazda CX-5", licensePlate: "MSu-2299", washType: "Express Clean", time: "3:00 PM", totalAmount: 45, color: "Soul Red", service: "Express Clean" },
    ],
  },
];

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
  PLATINUM: "bg-purple-100 text-purple-700",
  GOLD: "bg-yellow-100 text-yellow-700",
  SILVER: "bg-gray-100 text-gray-600",
  Member: "bg-blue-100 text-blue-700",
  Guest: "bg-slate-100 text-slate-500",
};

export default function QueuePage() {
  const navigate = useNavigate();
  const [lanes, setLanes] = useState<Lane[]>(initialLanes);
  const [waitingPool, setWaitingPool] = useState<Vehicle[]>(initialWaitingPool);
  const [completed, setCompleted] = useState<Vehicle[]>(initialCompleted);

  const [showCheckin, setShowCheckin] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [filteredBookings, setFilteredBookings] = useState<CustomerBooking[]>(allBookings);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  const closeModal = () => {
    setShowCheckin(false);
    setSearchPlate("");
    setFilteredBookings(allBookings);
    setSelectedBookingId(null);
    setNotFound(false);
  };

  const handleSearch = (value: string) => {
    setSearchPlate(value);
    setSelectedBookingId(null);
    if (value.trim() === "") {
      setFilteredBookings(allBookings);
      setNotFound(false);
    } else {
      const filtered = allBookings.filter(
        (b) =>
          b.licensePlate.toLowerCase().includes(value.toLowerCase()) ||
          b.customerName.toLowerCase().includes(value.toLowerCase()) ||
          b.phone.includes(value)
      );
      setFilteredBookings(filtered);
      setNotFound(filtered.length === 0);
    }
  };

  const handleAddToQueue = () => {
    if (!selectedBookingId) return;
    const customer = allBookings.find((c) => c.bookings.some((b) => b.id === selectedBookingId));
    const booking = customer?.bookings.find((b) => b.id === selectedBookingId);
    if (!booking || !customer) return;

    const newVehicle: Vehicle = {
      id: Date.now(),
      bookingId: booking.id,
      licensePlate: booking.licensePlate,
      model: booking.vehicleModel,
      color: booking.color,
      service: booking.service,
      tier: customer.tier,
      finishedAt: "",
      totalAmount: booking.totalAmount,
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Live Queue Management</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time status of active wash lanes and waiting vehicles.</p>
        </div>
        <button
          onClick={() => setShowCheckin(true)}
          className="bg-[#0037b0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 transition"
        >
          + Check-in
        </button>
      </div>

      <div className="flex gap-4">
        {/* Active Lanes */}
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Active Lanes</p>
          <div className="flex flex-col gap-3">
            {lanes.map((lane, index) => (
              <div key={lane.lane} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-[#0037b0] flex flex-col items-center justify-center text-white shrink-0">
                  <span className="text-xs font-medium">LANE</span>
                  <span className="text-lg font-bold">{lane.lane}</span>
                </div>
                {lane.status === "Empty" ? (
                  <div className="flex-1">
                    <p className="text-sm text-slate-400 italic">No vehicle assigned</p>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lane.status === "Washing" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {lane.status}
                      </span>
                      <span className="text-xs text-slate-400">{lane.model} • {lane.color}</span>
                    </div>
                    <p className="text-lg font-bold text-[#1e293b]">{lane.plate}</p>
                    <p className="text-xs text-[#0037b0] font-medium">{lane.service}</p>
                    <p className="text-xs text-slate-400">Est: {lane.est}</p>
                  </div>
                )}
                {lane.status !== "Empty" && (
                  <button
                    onClick={() => handleCompleted(index)}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition shrink-0"
                  >
                    Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Waiting Pool */}
        <div className="w-56 shrink-0">
          <div className="bg-[#0037b0] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-bold text-sm">Waiting Pool</p>
                <p className="text-blue-200 text-xs">{waitingPool.length} VEHICLES IN QUEUE</p>
              </div>
              <button
                onClick={() => setShowCheckin(true)}
                className="w-6 h-6 rounded-full bg-white/20 text-white text-sm flex items-center justify-center hover:bg-white/30"
              >+</button>
            </div>
            <div className="flex flex-col gap-2">
              {waitingPool.length === 0 && (
                <p className="text-blue-200 text-xs text-center py-4">No vehicles waiting</p>
              )}
              {waitingPool.map((v) => (
                <div key={v.id} className="bg-white rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#1e293b]">{v.licensePlate}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tierColors[v.tier]}`}>{v.tier}</span>
                  </div>
                  <p className="text-xs text-slate-500">{v.model} • {v.color}</p>
                  <p className="text-xs text-[#0037b0]">{v.service}</p>
                  <div className="mt-2 w-full bg-[#0037b0] text-white text-xs py-1 rounded-lg font-medium text-center">
                    Checked In
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="w-56 shrink-0">
          <div className="bg-[#14532d] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-bold text-sm">Completed</p>
                <p className="text-green-300 text-xs">AWAITING PAYMENT</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {completed.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleSelectCompleted(v)}
                  className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#1e293b]">{v.licensePlate}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tierColors[v.tier]}`}>{v.tier}</span>
                  </div>
                  <p className="text-xs text-slate-500">{v.model} • {v.color}</p>
                  <p className="text-xs text-[#0037b0]">{v.service}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">⏱ {v.finishedAt}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
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
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1e293b]">Check-in</h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-400 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 mb-4">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                value={searchPlate}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by License or Phone"
                className="flex-1 text-sm outline-none"
                autoFocus
              />
              {searchPlate && (
                <button
                  onClick={() => handleSearch("")}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >✕</button>
              )}
            </div>

            {/* Not found */}
            {notFound && (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-3">No booking found for "{searchPlate}"</p>
                <button className="bg-[#0037b0] text-white px-4 py-2 rounded-xl text-sm font-semibold w-full">
                  + Create Walk-in
                </button>
              </div>
            )}

            {/* Booking list */}
            {!notFound && (
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredBookings.map((customer) => (
                  <div key={customer.licensePlate} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm text-[#1e293b]">{customer.customerName}</p>
                        <p className="text-xs text-slate-400">{customer.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[customer.tier]}`}>
                        {customer.tier}
                      </span>
                    </div>
                    {customer.bookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBookingId(b.id)}
                        className={`rounded-xl p-3 border-2 cursor-pointer transition mb-1 bg-white ${
                          selectedBookingId === b.id
                            ? "border-[#0037b0] bg-blue-50"
                            : "border-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-[#1e293b]">{b.vehicleModel}</p>
                            <p className="text-xs text-slate-400">{b.licensePlate}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <div>
                            <p className="text-slate-400">Wash Type</p>
                            <p className="font-semibold text-[#0037b0]">{b.washType}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400">Time</p>
                            <p className="font-semibold text-[#1e293b]">{b.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Add to Queue button */}
            {selectedBookingId && (
              <button
                onClick={handleAddToQueue}
                className="w-full bg-[#0037b0] text-white py-3 rounded-xl font-semibold text-sm transition mt-4 hover:bg-blue-800"
              >
                Add to Queue
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
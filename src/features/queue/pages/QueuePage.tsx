//author: Ngọc
//version:2.0.1
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Search,
  X,
  XCircle,
  Droplets,
  Check,
  CreditCard,
  Wrench,
} from "lucide-react";
// author: Ngọc — import API thật
import {
  scanVehicle,
  confirmCheckIn,
  cancelGuestLeft,
  startService,
  completeService,
  getQueueData,
  collectPenaltyDeposit,
  setLaneMaintenance,
  type ScanVehicleResponse,
  type QueuePageData,
} from "../services/queueApi";
// ported onto dev: dev không có utils/currency.ts, dùng formatCurrency của dev thay formatVND
import { formatCurrency as formatVND } from "../../../utils/format";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { QUEUE_MESSAGES } from "../../../constants/queueMessages";
import Modal from "../../../components/ui/Modal";

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
  laneDbId: number;
  plate: string;
  model: string;
  color: string;
  service: string;
  status: "Washing" | "Completed" | "Empty" | "Maintenance";
  est: string;
  bookingId: number;
  totalAmount: number;
  ticketId?: number;
  tier?: Vehicle["tier"];
  voucherDiscount?: number;
  pointDiscount?: number;
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

const LICENSE_PLATE_REGEX = /^[0-9]{2}[A-HJ-NP-Z]{1,2}-[0-9]{4,5}$/;

// author: Ngọc — map customerTier từ BE ("MEMBER"/"GOLD"/"SILVER"/"PLATINUM"/null)
// sang giá trị tier mà UI đang dùng để tô màu badge (tierBadge)
const mapTier = (tier: string | null): Vehicle["tier"] => {
  if (!tier) return "Guest"; // không có customer (khách lẻ/anonymous) -> Guest
  if (tier === "MEMBER") return "Member";
  return tier as "PLATINUM" | "GOLD" | "SILVER";
};

const makeEmptyLane = (index: number, laneDbId = 0): Lane => ({
  lane: String(index + 1).padStart(2, "0"),
  laneDbId,
  plate: "—",
  model: "",
  color: "",
  service: "",
  status: "Empty",
  est: "",
  bookingId: 0,
  totalAmount: 0,
});

// Map errorCode từ BE → thông báo lỗi tiếng Anh (BE trả tiếng Việt cho 2 mã này)
const LANE_MAINTENANCE_ERROR_MAP: Record<string, string> = {
  WASH_LANE_002: "This lane could not be found.",
  WASH_LANE_004:
    "Cannot set this lane to maintenance while a car is being washed.",
  WASH_LANE_005: "This lane is not currently under maintenance.",
};

const tierBadge: Record<string, string> = {
  PLATINUM: "bg-primary-fixed text-on-primary-fixed",
  GOLD: "bg-secondary-fixed text-on-secondary-fixed",
  SILVER: "bg-surface-variant text-on-surface-variant",
  Member: "bg-surface-container text-primary",
  Guest: "bg-surface-container-low text-on-surface-variant",
};

export default function QueuePage() {
  const navigate = useNavigate();
  const [lanes, setLanes] = useState<Lane[]>([]);
  // author: Ngọc — Waiting Pool bắt đầu rỗng, load thật từ API qua useEffect dưới
  const [waitingPool, setWaitingPool] = useState<Vehicle[]>([]);
  const [completed, setCompleted] = useState<Vehicle[]>([]);
  const [cancelVehicle, setCancelVehicle] = useState<Vehicle | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [searchedPlate, setSearchedPlate] = useState("");
  const [searchPlateError, setSearchPlateError] = useState<string | null>(null);

  const [searchResult, setSearchResult] = useState<CustomerResult | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null,
  );
  const [isSearched, setIsSearched] = useState(false);
  // author: Ngọc — thêm state cho API thật
  const [scanResult, setScanResult] = useState<ScanVehicleResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [totalLanes, setTotalLanes] = useState(0);
  const [assignCar, setAssignCar] = useState<Vehicle | null>(null);
  const [notice, setNotice] = useState<{
    variant: "success" | "danger";
    message: string;
    icon?: ReactNode;
    title?: string;
    // hành động chính (nút phải). Khi có, popup render 2 nút: [cancelText] [actionLabel]
    // — nút trái/dấu X chỉ đóng popup, KHÔNG chạy hành động này
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  // lane đang mở popup chọn trạng thái (click vào lane Empty/Maintenance)
  const [laneStatusPicker, setLaneStatusPicker] = useState<Lane | null>(null);
  // thay đổi trạng thái đang chờ xác nhận ở popup confirm
  const [pendingLaneChange, setPendingLaneChange] = useState<{
    lane: Lane;
    maintenance: boolean;
  } | null>(null);
  // author: Ngọc — thu cọc phạt cho xe WALK_IN đang bị hạn chế trước khi cho Confirm Check-in
  // (mirror luồng đã có ở WalkInPage.tsx, nhưng bên Check-in phải gọi API thu cọc thật trước,
  // không chỉ truyền cờ boolean trong cùng 1 request như bên Create Walk-in)
  const [depositCollected, setDepositCollected] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositReceivedInput, setDepositReceivedInput] = useState("");
  const [depositModalError, setDepositModalError] = useState("");
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false);

  // author: Ngọc — đổ board (GET /api/queue hoặc kết quả PATCH start/complete) vào
  // cả 3 cột (Active Lanes / Waiting Pool / Completed). BE trả về cùng 1 shape board
  // nên dùng chung cho cả lần load đầu lẫn sau mỗi action.
  const applyBoard = useCallback((data: QueuePageData) => {
    setTotalLanes(data.activeLaneCount);

    // Waiting Pool: WAITING status
    const waiting: Vehicle[] = data.waitingPool.map((t) => ({
      id: t.id,
      bookingId: t.bookingId ?? 0,
      licensePlate: t.licensePlate ?? "—",
      model: t.vehicleBrand ?? "",
      color: t.vehicleColor ?? "",
      service: t.serviceName ?? "",
      tier: mapTier(t.customerTier),
      finishedAt: "",
      totalAmount: t.totalAmount ?? 0,
    }));
    setWaitingPool(waiting);

    // Active Lanes: render từ data.lanes — mỗi làn WASHING dùng currentBookingId
    // (do BE tính sẵn) để lookup đúng ticket, tránh nhầm lane khi nhiều xe cùng rửa.
    const builtLanes: Lane[] = data.lanes.map((l, idx) => {
      const label =
        l.laneName.replace(/\D/g, "") || String(idx + 1).padStart(2, "0");
      if (l.status === "MAINTENANCE") {
        return {
          ...makeEmptyLane(idx, l.id),
          lane: label,
          status: "Maintenance" as const,
        };
      }
      if (l.status !== "WASHING" || l.currentBookingId == null) {
        return { ...makeEmptyLane(idx, l.id), lane: label };
      }
      const ticket = data.activeLanes.find(
        (t) => t.bookingId === l.currentBookingId,
      );
      if (!ticket) {
        return { ...makeEmptyLane(idx, l.id), lane: label };
      }
      return {
        lane: label,
        laneDbId: l.id,
        plate: ticket.licensePlate ?? "—",
        model: ticket.vehicleBrand ?? "",
        color: ticket.vehicleColor ?? "",
        service: ticket.serviceName ?? "",
        status: "Washing" as const,
        est: "",
        bookingId: ticket.bookingId ?? 0,
        totalAmount: ticket.totalAmount ?? 0,
        ticketId: ticket.id,
        tier: mapTier(ticket.customerTier),
      };
    });
    setLanes(builtLanes);

    // Completed: COMPLETED status
    const done: Vehicle[] = data.completed.map((t) => ({
      id: t.id,
      bookingId: t.bookingId ?? 0,
      licensePlate: t.licensePlate ?? "—",
      model: t.vehicleBrand ?? "",
      color: t.vehicleColor ?? "",
      service: t.serviceName ?? "",
      tier: mapTier(t.customerTier),
      finishedAt: "",
      totalAmount: t.totalAmount ?? 0,
    }));
    setCompleted(done);
  }, []);

  // author: Ngọc — load toàn bộ queue thật từ GET /api/queue khi vào trang
  useEffect(() => {
    getQueueData()
      .then(applyBoard)
      .catch((e) => console.error("[Queue] loadQueue error:", e));
  }, [applyBoard]);

  const hasEmptyLane = lanes.some((l) => l.status === "Empty");

  const closeCheckinModal = () => {
    setShowCheckin(false);
    setSearchPlate("");
    setSearchResult(null);
    // author: Ngọc — reset scanResult khi đóng modal
    setScanResult(null);
    setSelectedBooking(null);
    setIsSearched(false);
    setDepositCollected(false);
    setShowDepositModal(false);
    setDepositReceivedInput("");
    setDepositModalError("");
  };

  // Xe WALK_IN đang bị hạn chế (violation_count > 3 + còn restricted_until) mới thực sự bị
  // confirmCheckIn chặn (xem StaffCheckInServiceImpl) — vehiclePenalized từ /scan không phân
  // biệt loại booking nên phải tự AND thêm điều kiện bookingType ở đây để tránh báo động giả
  // cho booking ADVANCE/SUBSCRIPTION.
  const requiresPenaltyDeposit =
    !!scanResult?.vehiclePenalized && scanResult?.bookingType === "WALK_IN";

  const handleConfirmDeposit = async () => {
    if (!scanResult?.bookingId) return;
    const requiredDeposit = scanResult.depositAmount ?? 0;
    const receivedAmount = Number(depositReceivedInput);
    if (!receivedAmount || receivedAmount < requiredDeposit) {
      setDepositModalError(
        `Please enter at least ${formatVND(requiredDeposit)}.`,
      );
      return;
    }
    setIsDepositSubmitting(true);
    setDepositModalError("");
    try {
      await collectPenaltyDeposit(scanResult.bookingId);
      setDepositCollected(true);
      setShowDepositModal(false);
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setDepositModalError(
        message ?? "Failed to collect deposit, please try again.",
      );
    } finally {
      setIsDepositSubmitting(false);
    }
  };

  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
    setDepositModalError("");
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
    const plate = searchPlate.trim();
    if (!plate) return;
    if (!LICENSE_PLATE_REGEX.test(plate)) {
      setSearchPlateError(
        "Invalid license plate format (e.g: 29A-12345 or 51AB-12345)",
      );
      return;
    }
    setSearchPlateError(null);
    setIsLoading(true);
    setIsSearched(true);
    setSearchedPlate(plate);
    setSelectedBooking(null);
    try {
      const result = await scanVehicle(plate);
      setScanResult(result);
      if (result.hasBooking) {
        setSearchResult({
          type: "booked",
          customerName: result.customerName ?? "",
          tier: mapTier(result.customerTier),
          bookings: [
            {
              id: result.bookingId!,
              vehicleModel: result.brandName ?? plate,
              licensePlate: plate,
              washType: result.serviceName ?? "",
              scheduledTime: `${result.slotStartTime} - ${result.slotEndTime}`,
              totalAmount: result.totalAmount ?? 0,
              color: result.color ?? "",
              service: result.serviceName ?? "",
              addOns: [],
            },
          ],
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

  const handleConfirmCheckIn = async () => {
    if (!selectedBooking || !scanResult?.bookingId) return;
    setIsLoading(true);
    try {
      const result = await confirmCheckIn(scanResult.bookingId);
      // Booking bị chuyển sang NO_SHOW nghĩa là khách bị ghi nhận vi phạm và
      // KHÔNG vào được Waiting Pool — hiển thị dấu X đỏ thay vì dấu tích xanh.
      const isPenalized = result.status === "NO_SHOW";
      const penalizedNotice = {
        variant: "danger" as const,
        icon: <XCircle size={48} className="text-error" />,
      };
      if (result.requiresWalkIn) {
        closeCheckinModal();
        // BE đã đổi booking sang NO_SHOW — refresh board ngay để nếu staff bấm OK/X
        // ở lại trang Queue thì không thấy dữ liệu cũ
        const board = await getQueueData();
        applyBoard(board);
        setNotice({
          ...(isPenalized ? penalizedNotice : { variant: "success" as const }),
          title: "Walk-in Required",
          message: result.message,
          actionLabel: "Create Walk-in",
          onAction: () =>
            navigate("/staff/walk-in", {
              state: { oldBookingId: result.oldBookingId },
            }),
        });
        return;
      }
      closeCheckinModal();
      const board = await getQueueData();
      applyBoard(board);
      if (isPenalized) {
        setNotice({
          ...penalizedNotice,
          message: result.message,
        });
      }
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setNotice({
        variant: "danger",
        message: message ?? QUEUE_MESSAGES.CHECK_IN_FAILED,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // "+" button — auto-assign xe đầu tiên trong waiting pool vào làn trống đầu tiên.
  const handleAddToLane = async () => {
    if (waitingPool.length === 0) return;
    const emptyIndex = lanes.findIndex((l) => l.status === "Empty");
    if (emptyIndex === -1) return;
    const next = waitingPool[0];
    setIsLoading(true);
    try {
      const board = await startService(next.bookingId);
      applyBoard(board);
    } catch {
      setNotice({
        variant: "danger",
        message: QUEUE_MESSAGES.ADD_TO_LANE_FAILED,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Click vào xe trong Waiting Pool — assign xe đó vào lane được chọn trong popup.
  const handleAssignToLane = async (laneDbId: number) => {
    if (!assignCar) return;
    setIsLoading(true);
    setAssignCar(null);
    try {
      const board = await startService(assignCar.bookingId, laneDbId);
      applyBoard(board);
    } catch {
      setNotice({
        variant: "danger",
        message: QUEUE_MESSAGES.ADD_TO_LANE_FAILED,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleted = async (index: number) => {
    const lane = lanes[index];
    if (!lane.bookingId) return;
    setIsLoading(true);
    try {
      const board = await completeService(lane.bookingId, lane.laneDbId);
      applyBoard(board);
    } catch {
      // show nothing — isLoading will reset and button re-enables
    } finally {
      setIsLoading(false);
    }
  };

  // gọi API cancel guest left
  // author: Ngọc — BE huỷ theo bookingId (check booking.status == CHECK_IN) và trả
  // về board đầy đủ -> set lại toàn bộ state từ board, không cập nhật cục bộ.
  const handleConfirmCancel = async () => {
    if (!cancelVehicle?.bookingId) return;
    setIsLoading(true);
    try {
      const board = await cancelGuestLeft(cancelVehicle.bookingId);
      applyBoard(board);
      setCancelVehicle(null);
      setNotice({ variant: "success", message: QUEUE_MESSAGES.CANCEL_SUCCESS });
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setNotice({
        variant: "danger",
        message: message ?? QUEUE_MESSAGES.CANCEL_FAILED,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMaintenance = async (
    laneDbId: number,
    maintenance: boolean,
  ) => {
    setIsLoading(true);
    try {
      const board = await setLaneMaintenance(laneDbId, maintenance);
      applyBoard(board);
      setNotice({
        variant: "success",
        message: maintenance
          ? QUEUE_MESSAGES.LANE_MAINTENANCE_ON
          : QUEUE_MESSAGES.LANE_MAINTENANCE_OFF,
      });
    } catch (error) {
      const { errorCode, message } = getApiErrorInfo(error);
      setNotice({
        variant: "danger",
        message:
          LANE_MAINTENANCE_ERROR_MAP[errorCode ?? ""] ??
          message ??
          QUEUE_MESSAGES.LANE_MAINTENANCE_FAILED,
      });
    } finally {
      setIsLoading(false);
    }
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
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-on-background">
            Live Queue Management
          </h1>
          <p className="text-sm mt-1 text-on-surface-variant">
            Real-time status of active wash lanes and waiting vehicles.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCheckin(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition bg-primary text-on-primary hover:opacity-90"
          >
            + Check-in
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Active Lanes */}
        <div className="w-90 shrink-0">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase text-outline">
              Active Lanes
            </p>
            <p className="text-xs text-outline">
              {lanes.filter((l) => l.status === "Washing").length}/{totalLanes}{" "}
              lanes in use
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {lanes.map((lane, index) => {
              const isStatusClickable =
                lane.status === "Empty" || lane.status === "Maintenance";
              return (
                <div
                  key={lane.lane}
                  onClick={
                    isStatusClickable
                      ? () => setLaneStatusPicker(lane)
                      : undefined
                  }
                  className={`rounded-2xl p-3 flex items-center gap-3 bg-white shadow-sm border border-outline-variant/30 ${
                    isStatusClickable
                      ? "cursor-pointer hover:bg-surface-container-low"
                      : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-primary text-on-primary">
                    <span className="text-[10px] font-medium leading-none">
                      LANE
                    </span>
                    <span className="text-base font-bold leading-tight">
                      {lane.lane}
                    </span>
                  </div>
                  {lane.status === "Empty" ? (
                    <div className="flex-1">
                      <p className="text-xs italic text-outline">
                        No vehicle assigned
                      </p>
                    </div>
                  ) : lane.status === "Maintenance" ? (
                    <div className="flex-1">
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 w-fit bg-surface-container-high text-on-surface-variant">
                        <Wrench className="w-2.5 h-2.5" />
                        Maintenance
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${lane.status === "Washing" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                        >
                          {lane.status === "Washing" ? (
                            <Droplets className="w-2.5 h-2.5" />
                          ) : (
                            <Check className="w-2.5 h-2.5" />
                          )}
                          {lane.status}
                        </span>
                        <span className="text-[11px] text-outline truncate">
                          {lane.model.split(" ")[0]} • {lane.color}
                        </span>
                      </div>
                      <p className="text-base font-bold text-on-surface tracking-wide">
                        {lane.plate}
                      </p>
                      <p className="text-[11px] font-medium text-primary truncate">
                        {lane.service}
                      </p>
                    </div>
                  )}
                  {lane.status === "Washing" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleted(index);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 bg-primary text-on-primary hover:opacity-90"
                    >
                      Completed
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Waiting Pool */}
        <div className="flex-1">
          <div className="rounded-t-2xl px-4 py-3 flex items-center justify-between bg-primary">
            <div>
              <p className="font-bold text-sm text-white">Waiting Pool</p>
              <p className="text-xs text-white/70">
                {waitingPool.length} VEHICLES IN QUEUE
              </p>
            </div>
            <button
              onClick={handleAddToLane}
              disabled={!hasEmptyLane || waitingPool.length === 0 || isLoading}
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <div className="rounded-b-2xl p-2.5 flex flex-col gap-2 bg-surface-container-lowest shadow-sm">
            {waitingPool.length === 0 && (
              <p className="text-xs text-center py-4 text-outline">
                No vehicles waiting
              </p>
            )}
            {waitingPool.map((v) => (
              <div
                key={v.id}
                onClick={() => hasEmptyLane && setAssignCar(v)}
                className={`rounded-xl px-3 py-2.5 flex items-center gap-2 bg-white border border-outline-variant/20 ${hasEmptyLane ? "cursor-pointer hover:bg-surface-container-low transition" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-on-surface">
                      {v.licensePlate}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tierBadge[v.tier]}`}
                    >
                      {v.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {v.model.split(" ")[0]} • {v.color}
                  </p>
                  <p className="text-[11px] font-medium text-primary flex items-center gap-0.5">
                    <Droplets className="w-2.5 h-2.5 shrink-0" /> {v.service}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCancelVehicle(v);
                  }}
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
              <p className="text-xs text-center py-4 text-outline">
                No completed vehicles
              </p>
            )}
            {completed.map((v) => (
              <div
                key={v.id}
                onClick={() => handleSelectCompleted(v)}
                className="rounded-xl px-3 py-2.5 cursor-pointer transition hover:bg-surface-container-low bg-white border border-outline-variant/20"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-on-surface">
                    {v.licensePlate}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tierBadge[v.tier]}`}
                  >
                    {v.tier}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {v.model.split(" ")[0]} • {v.color}
                </p>
                <p className="text-[11px] font-medium text-primary">
                  {v.service}
                </p>
                <div className="flex justify-end mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckin && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-inverse-surface/50"
          onClick={closeCheckinModal}
        >
          <div
            className="rounded-2xl shadow-xl w-full max-w-lg mx-4 bg-surface-container-lowest"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
              <h2 className="text-base font-bold font-heading text-on-surface">
                Vehicle Check-in
              </h2>
              <button
                onClick={closeCheckinModal}
                className="rounded-full p-1 hover:bg-surface-container transition"
              >
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="flex gap-2 mb-1">
                <div
                  className={`flex items-center gap-2 flex-1 rounded-xl px-3 py-2 border ${
                    searchPlateError ? "border-error" : "border-outline-variant"
                  }`}
                >
                  <Search className="w-4 h-4 shrink-0 text-outline" />
                  <input
                    type="text"
                    value={searchPlate}
                    onChange={(e) => {
                      setSearchPlate(e.target.value);
                      setSearchPlateError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Enter license plate..."
                    maxLength={10}
                    className="flex-1 text-sm outline-none bg-transparent text-on-surface"
                    autoFocus
                  />
                  {searchPlate && (
                    <button
                      onClick={() => {
                        setSearchPlate("");
                        setSearchResult(null);
                        setIsSearched(false);
                        setScanResult(null);
                        setSearchPlateError(null);
                      }}
                    >
                      <X className="w-4 h-4 text-outline" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition bg-primary text-on-primary disabled:opacity-50"
                >
                  {isLoading ? "..." : "Search"}
                </button>
              </div>
              {searchPlateError && (
                <p className="mb-3 text-xs text-error">{searchPlateError}</p>
              )}

              {!isSearched && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-surface-container">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-on-surface">
                    Search for a customer
                  </p>
                  <p className="text-xs mt-1 text-outline">
                    Enter license plate to find booking
                  </p>
                </div>
              )}

              {isSearched && searchResult?.type === "not-found" && (
                <div className="py-4">
                  <div className="rounded-xl p-4 mb-4 bg-error-container border border-error">
                    <p className="text-sm font-semibold text-on-error-container">
                      No booking found
                    </p>
                    <p className="text-xs mt-1 text-on-error-container">
                      No booking found for "{searchedPlate}" today.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      closeCheckinModal();
                      navigate("/staff/walk-in");
                    }}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary"
                  >
                    + Create Walk-in
                  </button>
                </div>
              )}

              {isSearched && searchResult?.type === "booked" && (
                <div className="py-2">
                  {requiresPenaltyDeposit && !depositCollected && (
                    <div className="rounded-xl px-4 py-3 mb-3 flex flex-col gap-2 bg-error-container border border-error">
                      <div>
                        <p className="text-xs font-semibold text-on-error-container">
                          Vehicle Restricted
                        </p>
                        <p className="text-xs text-on-error-container mt-0.5">
                          This vehicle has an active violation restriction. A{" "}
                          {formatVND(scanResult?.depositAmount ?? 0)} cash
                          deposit must be collected before check-in.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDepositModal(true)}
                        className="w-full py-2 rounded-lg text-xs font-semibold bg-error text-on-error hover:opacity-90"
                      >
                        Collect Penalty Deposit
                      </button>
                    </div>
                  )}
                  {requiresPenaltyDeposit && depositCollected && (
                    <div className="rounded-xl px-4 py-3 mb-3 bg-surface-container border border-outline-variant">
                      <p className="text-xs font-semibold text-on-surface">
                        Penalty deposit collected — ready to confirm.
                      </p>
                    </div>
                  )}
                  <div className="rounded-xl p-3 mb-3 bg-surface-container-low">
                    <p className="font-bold text-sm text-on-surface">
                      {searchResult.customerName}
                    </p>
                    {scanResult && (
                      <p className="text-xs text-outline mt-0.5">
                        {scanResult.serviceName && (
                          <span className="text-primary font-medium">
                            {scanResult.serviceName} •{" "}
                          </span>
                        )}
                        Slot: {scanResult.slotStartTime} -{" "}
                        {scanResult.slotEndTime}
                        {scanResult.totalAmount != null &&
                          scanResult.totalAmount > 0 && (
                            <span> • {formatVND(scanResult.totalAmount!)}</span>
                          )}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase mb-2 text-outline">
                    Select Booking
                  </p>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
                    {searchResult.bookings?.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`rounded-xl p-3 cursor-pointer transition border-2 ${selectedBooking?.id === b.id ? "border-primary bg-primary-fixed" : "border-outline-variant bg-surface-container-lowest"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">
                              {b.licensePlate}
                            </p>
                            <p className="text-xs font-medium mt-1 text-primary">
                              {b.scheduledTime}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-on-surface">
                            #{b.id}
                          </p>
                        </div>
                        {selectedBooking?.id === b.id && (
                          <div className="flex items-center gap-1 mt-2 text-primary"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirmCheckIn}
                    disabled={
                      !selectedBooking ||
                      isLoading ||
                      (requiresPenaltyDeposit && !depositCollected)
                    }
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

      {/* Lane Select Modal */}
      {assignCar && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-inverse-surface/50"
          onClick={() => setAssignCar(null)}
        >
          <div
            className="rounded-2xl shadow-xl w-full max-w-sm mx-4 bg-surface-container-lowest"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
              <div>
                <h2 className="text-base font-bold font-heading text-on-surface">
                  Select washing lane
                </h2>
                <p className="text-xs text-outline mt-0.5">
                  {assignCar.licensePlate} • {assignCar.service}
                </p>
              </div>
              <button
                onClick={() => setAssignCar(null)}
                className="rounded-full p-1 hover:bg-surface-container transition"
              >
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-2">
              {lanes
                .filter((l) => l.status === "Empty")
                .map((l) => (
                  <button
                    key={l.laneDbId}
                    onClick={() => handleAssignToLane(l.laneDbId)}
                    disabled={isLoading}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 border-2 border-outline-variant hover:border-primary hover:bg-primary-fixed transition disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-primary text-on-primary shrink-0">
                      <span className="text-[9px] font-medium leading-none">
                        LANE
                      </span>
                      <span className="text-sm font-bold leading-tight">
                        {l.lane}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface">
                      Lane {l.lane}
                    </span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-surface-container text-outline">
                      Trống
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelVehicle && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-inverse-surface/50"
          onClick={() => setCancelVehicle(null)}
        >
          <div
            className="rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 bg-surface-container-lowest"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-heading text-on-surface">
                Cancel Booking
              </h2>
              <button
                onClick={() => setCancelVehicle(null)}
                className="rounded-full p-1 hover:bg-surface-container transition"
              >
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            <div className="rounded-2xl p-5 mb-4 bg-surface-container-low border border-outline-variant">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-on-surface tracking-wide">
                    {cancelVehicle.licensePlate}
                  </p>
                  <p className="text-sm text-on-surface mt-0.5">
                    {cancelVehicle.model} • {cancelVehicle.color}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {cancelVehicle.service}
                  </p>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    {formatVND(cancelVehicle.totalAmount)}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${tierBadge[cancelVehicle.tier]}`}
                >
                  {cancelVehicle.tier}
                </span>
              </div>
            </div>
            {cancelVehicle.tier === "Guest" ? (
              <div className="rounded-xl px-4 py-3 mb-4 bg-error-container border border-error">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <XCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  <p className="text-xs font-semibold text-on-error-container">
                    Walk-in Cancellation
                  </p>
                </div>
                <p className="text-xs text-on-error-container">
                  1 violation point will be added to{" "}
                  <strong>{cancelVehicle.licensePlate}</strong>.
                </p>
              </div>
            ) : cancelVehicle.bookingType === "SUBSCRIPTION" ? (
              <div className="rounded-xl px-4 py-3 mb-4 bg-secondary-fixed border border-secondary">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <XCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  <p className="text-xs font-semibold text-on-secondary-fixed">
                    Unlimited / Family Package
                  </p>
                </div>
                <p className="text-xs text-on-secondary-fixed-variant">
                  No deposit collected. 1 violation point added.
                </p>
              </div>
            ) : (
              <div className="rounded-xl px-4 py-3 mb-4 bg-error-container border border-error">
                <p className="text-xs font-semibold mb-0.5 text-on-error-container">
                  Single Package — Deposit Required
                </p>
                <p className="text-xs text-on-error-container">
                  100% of the deposit amount will be collected.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setCancelVehicle(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-outline-variant text-on-surface-variant bg-surface-container-lowest"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-error text-on-error disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDepositModal}
        onClose={handleCloseDepositModal}
        variant="danger"
        title="Penalty Deposit Required"
        confirmText="Confirm Deposit Collected"
        onConfirm={handleConfirmDeposit}
        isConfirmLoading={isDepositSubmitting}
        message={
          <div className="flex flex-col gap-3 text-left">
            <p>
              This vehicle has an active violation restriction. Staff must
              collect a {formatVND(scanResult?.depositAmount ?? 0)} cash deposit
              at the counter before the vehicle can be checked in.
            </p>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                Amount Received
              </label>
              <input
                type="number"
                value={depositReceivedInput}
                onChange={(e) => {
                  setDepositReceivedInput(e.target.value);
                  setDepositModalError("");
                }}
                placeholder="0"
                className="w-full rounded-xl px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
              />
              {depositModalError && (
                <p className="text-sm text-error mt-1.5">{depositModalError}</p>
              )}
            </div>
          </div>
        }
      />

      {/* Lane status picker — click vào lane Empty/Maintenance mở popup chọn trạng thái */}
      {laneStatusPicker && (
        <Modal
          isOpen
          onClose={() => setLaneStatusPicker(null)}
          variant="custom"
        >
          <div className="flex w-full flex-col gap-4 text-left">
            <div>
              <h2 className="text-headline-md font-semibold text-on-surface">
                Lane {laneStatusPicker.lane} — change status
              </h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Choose the new status for this lane.
              </p>
            </div>

            <button
              type="button"
              disabled={laneStatusPicker.status === "Empty"}
              onClick={() => {
                setPendingLaneChange({
                  lane: laneStatusPicker,
                  maintenance: false,
                });
                setLaneStatusPicker(null);
              }}
              className={`rounded-lg border px-4 py-3 text-left text-body-md font-semibold transition-colors ${
                laneStatusPicker.status === "Empty"
                  ? "cursor-not-allowed border-outline-variant bg-surface-container-low text-on-surface-variant"
                  : "border-outline-variant text-on-surface hover:bg-surface-container-high"
              }`}
            >
              Available
              {laneStatusPicker.status === "Empty" && " (current)"}
            </button>

            <button
              type="button"
              disabled={laneStatusPicker.status === "Maintenance"}
              onClick={() => {
                setPendingLaneChange({
                  lane: laneStatusPicker,
                  maintenance: true,
                });
                setLaneStatusPicker(null);
              }}
              className={`rounded-lg border px-4 py-3 text-left text-body-md font-semibold transition-colors ${
                laneStatusPicker.status === "Maintenance"
                  ? "cursor-not-allowed border-outline-variant bg-surface-container-low text-on-surface-variant"
                  : "border-outline-variant text-on-surface hover:bg-surface-container-high"
              }`}
            >
              Maintenance
              {laneStatusPicker.status === "Maintenance" && " (current)"}
            </button>

            <button
              type="button"
              onClick={() => setLaneStatusPicker(null)}
              className="text-body-sm font-semibold text-on-surface-variant hover:underline"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm popup — xác nhận trước khi thực sự gọi API đổi trạng thái */}
      <Modal
        isOpen={!!pendingLaneChange}
        onClose={() => setPendingLaneChange(null)}
        variant="confirm"
        title="Change lane status?"
        message={
          pendingLaneChange
            ? `Set Lane ${pendingLaneChange.lane.lane} to ${
                pendingLaneChange.maintenance ? "Maintenance" : "Available"
              }?`
            : ""
        }
        confirmText="Confirm"
        isConfirmLoading={isLoading}
        onConfirm={async () => {
          if (!pendingLaneChange) return;
          await handleToggleMaintenance(
            pendingLaneChange.lane.laneDbId,
            pendingLaneChange.maintenance,
          );
          setPendingLaneChange(null);
        }}
      />

      {/* notice.onAction có giá trị -> dùng variant "confirm" để lấy layout 2 nút,
          nút phải chạy onAction (vd điều hướng sang Create Walk-in), còn nút trái
          và dấu X chỉ đóng popup */}
      <Modal
        isOpen={!!notice}
        onClose={() => setNotice(null)}
        variant={notice?.onAction ? "confirm" : (notice?.variant ?? "success")}
        icon={notice?.icon}
        title={
          notice?.title ?? (notice?.variant === "danger" ? "Error" : "Notice")
        }
        message={notice?.message}
        cancelText={notice?.onAction ? "OK" : undefined}
        confirmText={
          notice?.actionLabel ??
          (notice?.variant === "danger" ? "OK" : undefined)
        }
        onConfirm={notice?.onAction}
      />
    </div>
  );
}

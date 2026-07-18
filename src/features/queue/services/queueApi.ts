//@author: BaoNgoc
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";

// ── Types ──────────────────────────────────────────────────────────────────

// author: Ngọc — thêm type cho response scan biển số từ BE
export interface ScanVehicleResponse {
  bookingId: number | null;
  licensePlate: string;
  customerName: string | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
  hasBooking: boolean;
  vehiclePenalized: boolean;
  appointmentDate: string | null;
  bookingType: string | null;
  brandName: string | null;
  color: string | null;
  customerTier: string | null;
  depositAmount: number | null;
  depositPaid: boolean | null;
  remainingAmount: number | null;
  serviceName: string | null;
  servicePrice: number | null;
  stationAddress: string | null;
  stationName: string | null;
  status: string | null;
  technicianName: string | null;
  totalAmount: number | null;
  voucherCode: string | null;
  voucherDiscountAmount: number | null;
  voucherDiscountPercent: number | null;
}

// author: Ngọc — thêm type cho response confirm check-in từ BE
export interface CheckInResultResponse {
  bookingId: number;
  licensePlate: string;
  customerName: string;
  status: string;
  queueTicketNumber: string | null;
  minutesDeviation: number | null;
  message: string;
  requiresWalkIn: boolean;
  oldBookingId: number | null;
  checkInAt: string | null;
}

// ── API calls ──────────────────────────────────────────────────────────────

// author: Ngọc — thêm hàm quét biển số xe tại quầy
export const scanVehicle = async (
  licensePlate: string
): Promise<ScanVehicleResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<ScanVehicleResponse>>(
    "/api/v1/staff/checkin/scan",
    { licensePlate }
  );
  return res.data.data;
};

// thêm hàm xác nhận check-in khi Staff bấm [CONFIRM CHECK_IN]
export const confirmCheckIn = async (
  bookingId: number
): Promise<CheckInResultResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CheckInResultResponse>>(
    `/api/v1/staff/checkin/confirm/${bookingId}`
  );
  return res.data.data;
};

// hàm huỷ booking khi khách bỏ về
// author: Ngọc — BE đã đổi path param từ bookingId sang ticketId (queue ticket id),
// đổi tên param cho khớp; FE phải truyền ticket.id, KHÔNG phải booking.id nữa
// BE nhận bookingId (KHÔNG phải ticketId) và check booking.status == CHECK_IN,
// trả về board đầy đủ sau khi huỷ -> FE set lại state từ board này.
export const cancelGuestLeft = async (
  bookingId: number
): Promise<QueuePageData> => {
  const res = await axiosClient.patch<ApiSuccessResponse<QueueResponseData>>(
    `/api/queue/${bookingId}/cancel-guest-left`
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Cancel guest left failed");
  }
  return mapBoard(res.data.data);
};

// author: Ngọc — type cho 1 ticket hàng chờ, khớp với QueueTicketResponse bên BE
export interface QueueTicketDTO {
  id: number;
  ticketNumber: string;
  status: string;
  isBooking: boolean;
  priorityScore: number;
  bookingId: number | null;
  licensePlate: string | null;
  customerName: string | null;
  customerTier: string | null;
  vehicleBrand: string | null;
  vehicleColor: string | null;
  serviceName: string | null;
  stationId: number | null;
  stationName: string | null;
  totalAmount: number | null;
}

// 1 làn rửa (chưa bị xoá) của station — BE: WashLaneResponse. status: "AVAILABLE" | "WASHING".
export interface WashLaneDTO {
  id: number;
  laneName: string;
  status: string;
  currentBookingId?: number | null;
}

// BE trả về object có queue array, lanes array và *LaneCount
interface QueueResponseData {
  activeLaneCount: number;
  availableLaneCount: number;
  lanes: WashLaneDTO[];
  queue: QueueTicketDTO[];
}

export interface QueuePageData {
  activeLaneCount: number;
  availableLaneCount: number;
  lanes: WashLaneDTO[]; // tất cả làn chưa bị xoá của station (nguồn sự thật để render ô làn)
  activeLanes: QueueTicketDTO[]; // status === "WASHING" (chi tiết xe trong làn)
  waitingPool: QueueTicketDTO[]; // status === "CHECK_IN" (đã check-in, đang chờ vào làn)
  completed: QueueTicketDTO[]; // status === "COMPLETED"
}

// Map QueueBoardResponse thô của BE -> QueuePageData mà UI dùng. Dùng chung cho
// cả lần load đầu (GET) lẫn các action start/complete (PATCH) vì BE trả về cùng
// 1 shape board đầy đủ.
// LƯU Ý: BE map ticket.status = booking.status (QueueMapper), nên ticket đang chờ
// trả về status "CHECK_IN" (KHÔNG phải "WAITING"); query chỉ trả ticket có booking,
// status ∈ {CHECK_IN, WASHING, COMPLETED}.
const mapBoard = (data: QueueResponseData): QueuePageData => {
  const { activeLaneCount, availableLaneCount, lanes, queue } = data;
  return {
    activeLaneCount,
    availableLaneCount,
    lanes: lanes ?? [],
    activeLanes: queue.filter((t) => t.status === "WASHING"),
    waitingPool: queue.filter((t) => t.status === "CHECK_IN"),
    completed: queue.filter((t) => t.status === "COMPLETED"),
  };
};

export const getQueueData = async (): Promise<QueuePageData> => {
  const res = await axiosClient.get<ApiSuccessResponse<QueueResponseData>>(
    "/api/queue"
  );
  return mapBoard(res.data.data);
};

// author: Ngọc — gọi API thêm xe vào làn rửa (booking CHECK_IN -> WASHING).
// laneId: DB id của làn cụ thể (khi staff chọn thủ công); null = auto-assign làn đầu tiên.
export const startService = async (
  bookingId: number,
  laneId?: number
): Promise<QueuePageData> => {
  const url = laneId != null
    ? `/api/queue/${bookingId}/start?laneId=${laneId}`
    : `/api/queue/${bookingId}/start`;
  const res = await axiosClient.patch<ApiSuccessResponse<QueueResponseData>>(url);
  return mapBoard(res.data.data);
};

// BE nhận bookingId + laneId (DB id của làn cần giải phóng) để tránh giải phóng nhầm làn.
export const completeService = async (
  bookingId: number,
  laneId?: number
): Promise<QueuePageData> => {
  const url = laneId != null
    ? `/api/queue/${bookingId}/complete?laneId=${laneId}`
    : `/api/queue/${bookingId}/complete`;
  const res = await axiosClient.patch<ApiSuccessResponse<QueueResponseData>>(url);
  return mapBoard(res.data.data);
};

// Staff bật/gỡ bảo trì cho 1 lane của station mình — PATCH /api/queue/lanes/{laneId}/maintenance
export const setLaneMaintenance = async (
  laneId: number,
  maintenance: boolean,
): Promise<QueuePageData> => {
  const res = await axiosClient.patch<ApiSuccessResponse<QueueResponseData>>(
    `/api/queue/lanes/${laneId}/maintenance?maintenance=${maintenance}`,
  );
  return mapBoard(res.data.data);
};

export const collectPenaltyDeposit = async (
  bookingId: number
): Promise<CheckInResultResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CheckInResultResponse>>(
    `/api/v1/staff/checkin/collect-penalty-deposit/${bookingId}`
  );
  return res.data.data;
};

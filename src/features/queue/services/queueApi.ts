//@author: BaoNgoc
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";

// ── Types ──────────────────────────────────────────────────────────────────
export interface VehicleDTO {
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

export interface LaneDTO {
  laneId: string;
  laneNumber: string;
  plate: string;
  model: string;
  color: string;
  service: string;
  status: "WASHING" | "AVAILABLE";
  estimatedTime: string;
  bookingId: number;
  totalAmount: number;
}

export interface QueuePageData {
  activeLanes: LaneDTO[];
  waitingPool: VehicleDTO[];
  completed: VehicleDTO[];
}

// author: Ngọc — thêm type cho response scan biển số từ BE
export interface ScanVehicleResponse {
  bookingId: number | null;
  licensePlate: string;
  customerName: string | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
  hasBooking: boolean;
  vehiclePenalized: boolean;
}

// author: Ngọc — thêm type cho response confirm check-in từ BE
export interface CheckInResultResponse {
  bookingId: number;
  licensePlate: string;
  customerName: string;
  status: string;
}

// ── API calls ──────────────────────────────────────────────────────────────
// Lấy toàn bộ dữ liệu queue
export const getQueueData = async (): Promise<QueuePageData> => {
  const res = await axiosClient.get<ApiSuccessResponse<QueuePageData>>(
    "/api/queue"
  );
  return res.data.data;
};

// Staff click [Completed] — đổi trạng thái washlane + booking
export const completeLane = async (laneId: string): Promise<void> => {
  await axiosClient.patch<ApiSuccessResponse<void>>(
    `/api/lanes/${laneId}/complete`
  );
};

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
export const cancelGuestLeft = async (bookingId: number): Promise<void> => {
  const res = await axiosClient.patch<ApiSuccessResponse<null>>(
    `/api/queue/${bookingId}/cancel-guest-left`
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Cancel guest left failed");
  }
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
}

// author: Ngọc — lấy danh sách hàng chờ thật (status WAITING) để đổ vào Waiting Pool
export const getActiveQueue = async (): Promise<QueueTicketDTO[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<QueueTicketDTO[]>>(
    "/api/queue"
  );
  return res.data.data;
};
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

// BE trả về array phẳng QueueTicketDTO[], FE tự group theo status
export interface QueuePageData {
  activeLanes: QueueTicketDTO[]; // status === "IN_SERVICE"
  waitingPool: QueueTicketDTO[]; // status === "WAITING"
  completed: QueueTicketDTO[]; // status === "COMPLETED"
}

// author: Ngọc — lấy toàn bộ dữ liệu queue, group theo status ở FE
export const getQueueData = async (): Promise<QueuePageData> => {
  const res = await axiosClient.get<ApiSuccessResponse<QueueTicketDTO[]>>(
    "/api/queue"
  );
  const tickets = res.data.data;
  return {
    activeLanes: tickets.filter((t) => t.status === "IN_SERVICE"),
    waitingPool: tickets.filter((t) => t.status === "WAITING"),
    completed: tickets.filter((t) => t.status === "COMPLETED"),
  };
};

export const collectPenaltyDeposit = async (
  bookingId: number
): Promise<CheckInResultResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CheckInResultResponse>>(
    `/api/v1/staff/checkin/collect-penalty-deposit/${bookingId}`
  );
  return res.data.data;
};

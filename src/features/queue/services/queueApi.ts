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

// ── API calls ──────────────────────────────────────────────────────────────

// Lấy toàn bộ dữ liệu queue
export const getQueueData = async (): Promise<QueuePageData> => {
  const res = await axiosClient.get<ApiSuccessResponse<QueuePageData>>(
    "/api/queue"
  );
  return res.data.data;
};

// Staff click [Completed] — đổi trạng thái washlane + booking
export const completeLane = async (
  laneId: string
): Promise<void> => {
  await axiosClient.patch<ApiSuccessResponse<void>>(
    `/api/lanes/${laneId}/complete`
  );
};
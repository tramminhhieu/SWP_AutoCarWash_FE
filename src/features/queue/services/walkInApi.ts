import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";

// Mirrors BE CheckPhoneResponse.VehicleSubscriptionDTO (vietbinh_branch, WalkInCheckInService.checkPhone) —
// BE đã lọc sẵn chỉ trả về subscription đang ACTIVE và chưa hết hạn tính đến hôm nay,
// FE không cần tự check ngày/hạn nữa.
export interface VehicleSubscriptionDTO {
  subscriptionId: number;
  subscriptionPlanId: number;
  servicePackageId: number;
  planName: string;
  planType: "UNLIMITED" | "FAMILY";
  endDate: string;
  status: string;
}

export interface SavedVehicleDTO {
  id: number;
  licensePlate: string;
  brandName: string;
  color: string;
  subscriptionInfo?: VehicleSubscriptionDTO[];
}

export interface CheckPhoneResponse {
  existed: boolean;
  customerName?: string;
  tierName?: string;
  customerId?: number;
  savedVehicles?: SavedVehicleDTO[];
}

export interface AvailableSlotDTO {
  slotId: number;
  startTime: string;
  endTime: string;
  // Danh sách đầy đủ slotId của khối giờ này (BE đã gộp sẵn theo tổng thời lượng service+addon) —
  // gửi nguyên mảng này lên làm chosenSlotIds khi confirm, không tự gộp lại ở FE.
  associatedSlotIds: number[];
}

export interface BookingSummaryResponse {
  rawAmount: number;
  packageDiscount: number;
  penaltyDeposit: number;
  transferredCredit: number;
  remainingBalance: number;
  systemNotice: string | null;
  isActionBlock: boolean;
  availableSlots: AvailableSlotDTO[];
}

export interface CalculateInvoiceRequest {
  customerId?: number;
  licensePlate: string;
  servicePackageId: number;
  stationId: number;
  addonIds?: number[];
}

export interface CreateWalkInRequest {
  customerId?: number;
  existingVehicleId?: number;
  licensePlate?: string;
  brandName?: string;
  color?: string;
  servicePackageId: number;
  addonIds?: number[];
  chosenSlotIds?: number[];
  stationId: number;
  penaltyDepositCollected: boolean;
}

export interface CreateWalkInResponse {
  bookingId: number;
  queueTicketId: number;
  ticketNumber: string;
  status: string;
  remainingBalance: number;
  checkInAt: string | null;
  message: string;
}

export interface WalkInServicePackageDTO {
  id: number;
  name: string;
  basePrice: number;
  requiredSlot: number;
  description: string;
}

export interface WalkInAddonServiceDTO {
  id: number;
  name: string;
  price: number;
  description: string;
  durationMinutes: number;
}

export interface WalkInFormDataResponse {
  servicePackages: WalkInServicePackageDTO[];
  addonServices: WalkInAddonServiceDTO[];
}

export const getWalkInFormData = async (): Promise<WalkInFormDataResponse> => {
  const res = await axiosClient.get<ApiSuccessResponse<WalkInFormDataResponse>>(
    "/api/v1/staff/create-walkin/form-data"
  );
  return res.data.data;
};

export const checkPhone = async (phone: string): Promise<CheckPhoneResponse> => {
  const res = await axiosClient.get<ApiSuccessResponse<CheckPhoneResponse>>(
    "/api/v1/staff/create-walkin/check-phone",
    { params: { phone } }
  );
  return res.data.data;
};

export const calculateInvoice = async (
  req: CalculateInvoiceRequest
): Promise<BookingSummaryResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<BookingSummaryResponse>>(
    "/api/v1/staff/create-walkin/calculate-invoice",
    req
  );
  return res.data.data;
};

export const createWalkIn = async (
  req: CreateWalkInRequest
): Promise<CreateWalkInResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CreateWalkInResponse>>(
    "/api/v1/staff/create-walkin/create",
    req
  );
  return res.data.data;
};

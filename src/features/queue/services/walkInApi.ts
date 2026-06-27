import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";

export interface SavedVehicleDTO {
  id: number;
  licensePlate: string;
  brandName: string;
  color: string;
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
}

export interface BookingSummaryResponse {
  rawAmount: number;
  packageDiscount: number;
  penaltyDeposit: number;
  transferredCredit: number;
  remainingBalance: number;
  systemNotice: string | null;
  actionBlock: boolean;
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
  message: string;
}

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

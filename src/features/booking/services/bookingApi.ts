// author: Bảo Ngọc — gọi API lấy chi tiết booking (AC-25.3.2), dùng cho PaymentPage
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";

export interface AddonInfo {
  addonName: string;
  addonPrice: number;
}

export interface BookingDetailResponse {
  bookingId: number;
  status: string;
  bookingType: string;
  customerTier: string | null;
  serviceName: string;
  addons: AddonInfo[];
  licensePlate: string;
  brandName: string;
  color: string;
  stationName: string;
  stationAddress: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  technicianName: string | null;
  servicePrice: number;
  addonTotal: number;
  depositAmount: number;
  voucherCode: string | null;
  voucherDiscountPercent: number | null;
  voucherDiscountAmount: number;
  totalAmount: number;
  isDepositPaid: boolean;
  remainingAmount: number;
}

export const getBookingDetail = async (
  bookingId: number
): Promise<BookingDetailResponse> => {
  const res = await axiosClient.get<ApiSuccessResponse<BookingDetailResponse>>(
    `/api/bookings/${bookingId}`
  );
  return res.data.data;
};

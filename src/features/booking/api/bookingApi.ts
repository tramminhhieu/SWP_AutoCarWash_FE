import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  BookingContext,
  CreateBookingRequest,
  CreateBookingResponse,
  PreviewPriceRequest,
  PreviewPriceResponse,
} from "../types/booking";
import type {
  BookingSlot,
  GetAvailableSlotsRequest,
} from "../types/bookingSlot";

// API-02-01: GET BOOKING CONTEXT
export const getBookingContext = async (
  stationId: number,
): Promise<BookingContext> => {
  const res = await axiosClient.get<ApiSuccessResponse<BookingContext>>(
    API.BOOKING.BOOKING_CONTEXT(stationId),
  );
  return res.data.data;
};

// API-02-02: GET AVAILABLE SLOTS
// Lưu ý: response thật trả về { slots: [...] } lồng trong "data" (theo API.txt),
// nên kiểu trả về của axios là { slots: BookingSlot[] }
export const getAvailableSlots = async (
  stationId: number,
  payload: GetAvailableSlotsRequest,
): Promise<BookingSlot[]> => {
  const res = await axiosClient.post<
    ApiSuccessResponse<{ slots: BookingSlot[] }>
  >(API.BOOKING.BOOKING_SLOTS(stationId), payload);
  return res.data.data.slots;
};

// API-02-03: CREATE BOOKING
export const createBooking = async (
  payload: CreateBookingRequest,
): Promise<CreateBookingResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CreateBookingResponse>>(
    API.BOOKING.CREATE_BOOKING,
    payload,
  );
  return res.data.data;
};

// API-02-04: PREVIEW BOOKING PRICE
export const previewPrice = async (
  payload: PreviewPriceRequest,
): Promise<PreviewPriceResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<PreviewPriceResponse>>(
    API.BOOKING.PREVIEW_PRICE,
    payload,
  );
  return res.data.data;
};

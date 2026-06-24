import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  BookingContext,
  CreateBookingRequest,
  CreateBookingResponse,
  PreviewPriceRequest,
  PreviewPriceResponse,
  BookingCard,
  BookingDetail,
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
/**
 * Fetches a customer's upcoming bookings (status CONFIRMED/CHECKED_IN/WASHING).
 *
 * @param customerId - ID of the customer whose bookings should be listed.
 * @returns The list of upcoming {@link BookingCard}s, unwrapped from the
 *   backend's `ApiResponse` envelope.
 */
export async function getUpcomingBookings(
  customerId: number,
): Promise<BookingCard[]> {
  const res = await axiosClient.get<ApiSuccessResponse<BookingCard[]>>(
    API.BOOKINGS.UPCOMING,
    {
      params: { customerId },
    },
  );
  return res.data.data;
}

/**
 * Fetches a customer's past bookings (status PAID/CANCELLED/NO_SHOW).
 *
 * @param customerId - ID of the customer whose bookings should be listed.
 * @returns The list of past {@link BookingCard}s, unwrapped from the
 *   backend's `ApiResponse` envelope.
 */
export async function getPastBookings(
  customerId: number,
): Promise<BookingCard[]> {
  const res = await axiosClient.get<ApiSuccessResponse<BookingCard[]>>(
    API.BOOKINGS.PAST,
    {
      params: { customerId },
    },
  );
  return res.data.data;
}

/**
 * Fetches the full detail of a single booking (pricing, addons, station,
 * technician), unlike the lightweight {@link BookingCard} used in the lists.
 *
 * @param bookingId - ID of the booking to fetch.
 * @returns The {@link BookingDetail}, unwrapped from the backend's
 *   `ApiResponse` envelope.
 */
export async function getBookingDetail(
  bookingId: number,
): Promise<BookingDetail> {
  const res = await axiosClient.get<ApiSuccessResponse<BookingDetail>>(
    API.BOOKINGS.DETAIL(bookingId),
  );
  return res.data.data;
}

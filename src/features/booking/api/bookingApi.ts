import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiResponse } from "../../../types/apiResponse";
import type { BookingCard } from "../types/booking";

/**
 * Fetches a customer's upcoming bookings (status CONFIRMED/CHECKED_IN/WASHING).
 *
 * @param customerId - ID of the customer whose bookings should be listed.
 * @returns The list of upcoming {@link BookingCard}s, unwrapped from the
 *   backend's `ApiResponse` envelope.
 */
export async function getUpcomingBookings(customerId: number): Promise<BookingCard[]> {
  const response = await axiosClient.get<ApiResponse<BookingCard[]>>(API.BOOKINGS.UPCOMING, {
    params: { customerId },
  });
  return response.data.data;
}

/**
 * Fetches a customer's past bookings (status PAID/CANCELLED/NO_SHOW).
 *
 * @param customerId - ID of the customer whose bookings should be listed.
 * @returns The list of past {@link BookingCard}s, unwrapped from the
 *   backend's `ApiResponse` envelope.
 */
export async function getPastBookings(customerId: number): Promise<BookingCard[]> {
  const response = await axiosClient.get<ApiResponse<BookingCard[]>>(API.BOOKINGS.PAST, {
    params: { customerId },
  });
  return response.data.data;
}

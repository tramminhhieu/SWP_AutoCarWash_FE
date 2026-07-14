// API cho Admin Customer Booking History: GET /api/customers/{customerId}/bookings
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AdminBookingHistoryFilters,
  AdminCustomerBookingHistoryPage,
} from "../types/adminCustomerBooking";

export async function getCustomerBookingHistory(
  customerId: number,
  filters: AdminBookingHistoryFilters,
): Promise<AdminCustomerBookingHistoryPage> {
  const res = await axiosClient.get<
    ApiSuccessResponse<AdminCustomerBookingHistoryPage>
  >(API.CUSTOMERS.BOOKINGS(customerId), { params: filters });
  return res.data.data;
}

export interface AdminStationOption {
  id: number;
  stationName: string;
}

export async function getAllStations(): Promise<AdminStationOption[]> {
  const res = await axiosClient.get<ApiSuccessResponse<AdminStationOption[]>>(
    API.LOCATION.ALL_STATIONS,
  );
  return res.data.data;
}

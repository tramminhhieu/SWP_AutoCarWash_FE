import type { BookingStatus } from "../../booking/types/booking";

// Mirrors backend `booking/dto/response/CustomerBookingHistoryItemResponse.java`,
// 1 dòng trong bảng lịch sử đặt lịch của khách hàng, xem bởi Admin.
export interface AdminCustomerBookingRow {
  bookingId: number;
  appointmentDate: string; // "yyyy-MM-dd"
  serviceCategoryName: string;
  licensePlate: string;
  brandName: string;
  status: BookingStatus;
  totalAmount: number;
  staffName: string | null;
}

// Mirrors backend `booking/dto/response/CustomerBookingHistoryPageResponse.java`,
// returned by GET /api/customers/{customerId}/bookings (admin only, FE-US-09-04).
export interface AdminCustomerBookingHistoryPage {
  content: AdminCustomerBookingRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminBookingHistoryFilters {
  page?: number;
  size?: number;
  vehicleKeyword?: string;
  serviceCategoryId?: number;
  status?: BookingStatus;
  stationId?: number;
  year?: number;
  month?: number;
}

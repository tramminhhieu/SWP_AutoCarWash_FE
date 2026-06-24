// ====== API-02-01: GET BOOKING CONTEXT ======

export interface BookingVehicle {
  id: number;
  licensePlate: string;
  brandName: string;
  activeSubscription?: {
    type: "UNLIMITED" | "FAMILY";
    servicePackageId: number;
  } | null;
}

export interface BookingServicePackage {
  id: number;
  name: string;
  basePrice: number;
  durationMinutes: number;
}

export interface BookingAddonService {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface BookingVoucher {
  id: number;
  voucherCode: string;
  discountPercentage: number;
  minOrderValue: number;
}

export interface BookingWindow {
  minDate: string; // "2026-06-17"
  maxDate: string; // "2026-06-24"
}

export interface BookingStation {
  stationId: number;
  stationName: string;
  address: string;
}

export interface BookingContext {
  station: BookingStation;
  bookingWindow: BookingWindow;
  vehicles: BookingVehicle[];
  servicePackages: BookingServicePackage[];
  addonServices: BookingAddonService[];
  vouchers: BookingVoucher[];
}

// errorCode riêng khi customer chưa có xe (theo API-02-01 case fail)
export const NO_VEHICLE_REGISTERED = "NO_VEHICLE_REGISTERED";

// ====== API-02-03: CREATE BOOKING ======

export interface CreateBookingRequest {
  stationId: number;
  vehicleId: number;
  servicePackageId: number;
  addonServiceIds: number[];
  appointmentDate: string; // "2026-06-18"
  slotIds: number[];
  voucherCode?: string;
}

export interface CreateBookingResponse {
  bookingId: number;
  status: string;
  totalAmount: number;
  slotIds: number[];
}

// ====== API-02-04: PREVIEW BOOKING PRICE ======

export interface PreviewPriceRequest {
  stationId: number;
  vehicleId: number;
  servicePackageId: number;
  addonServiceIds: number[];
  voucherCode?: string;
}

export interface PreviewPriceBreakdown {
  servicePrice: number;
  addonPrice: number;
  subTotal: number;
  voucherCode?: string;
  voucherDiscount: number;
  finalTotal: number;
}

export interface PreviewPriceAppliedVoucher {
  valid: boolean;
  discountPercentage: number;
}

export interface PreviewPriceResponse {
  currency: string;
  breakdown: PreviewPriceBreakdown;
  appliedVoucher?: PreviewPriceAppliedVoucher;
}
/**
 * Lifecycle status of a booking, as returned by the backend's
 * `BookingCardResponse.status` field.
 *
 * - `CONFIRMED` / `CHECKED_IN` / `WASHING` — appear in the "upcoming" list.
 * - `PAID` / `CANCELLED` / `NO_SHOW` — appear in the "past" list.
 */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "WASHING"
  | "PAID"
  | "CANCELLED"
  | "NO_SHOW";

/**
 * Action a customer is allowed to take on a given booking, as returned by
 * the backend's `BookingCardResponse.allowedActions` field. The list of
 * buttons shown on a booking card must be filtered to only this set.
 */
export type BookingAction = "CANCEL" | "WRITE_REVIEW" | "VIEW_DETAILS";

/**
 * Mirrors the backend's `BookingCardResponse` DTO
 * (`com.swp.autocarwash.booking.dto.response.BookingCardResponse`), as
 * returned by `GET /api/bookings/upcoming` and `GET /api/bookings/past`.
 */
export interface BookingCard {
  bookingId: number;
  serviceName: string;
  licensePlate: string;
  brandName: string;
  color: string;
  status: BookingStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  allowedActions: BookingAction[];
}

export interface BookingAddon {
  addonName: string;
  addonPrice: number;
}

/**
 * Mirrors the backend's `BookingDetailResponse` DTO
 * (`com.swp.autocarwash.booking.dto.response.BookingDetailResponse`), as
 * returned by `GET /api/bookings/{bookingId}`.
 */
export interface BookingDetail {
  bookingId: number;
  status: BookingStatus;
  serviceName: string;
  addons: BookingAddon[];
  licensePlate: string;
  brandName: string;
  color: string;
  stationName: string | null;
  stationAddress: string | null;
  appointmentDate: string;
  startTime: string | null;
  endTime: string | null;
  technicianName: string | null;
  servicePrice: number;
  addonTotal: number;
  voucherCode: string | null;
  voucherDiscountPercent: number | null;
  voucherDiscountAmount: number;
  totalAmount: number;
  isDepositPaid: boolean;
  depositAmount: number | null;
  remainingAmount: number;
}

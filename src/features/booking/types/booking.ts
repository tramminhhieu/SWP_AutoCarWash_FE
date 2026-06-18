// ====== API-02-01: GET BOOKING CONTEXT ======

export interface BookingVehicle {
  id: number;
  licensePlate: string;
  brandName: string;
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

export interface BookingContext {
  stationId: number;
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

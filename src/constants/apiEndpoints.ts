/**
 * Centralised REST endpoint paths for the AutoCarWash backend.
 * Paths are relative to `axiosClient`'s `baseURL` (`/api`).
 */
export const API = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/auth/register",
  },

  LOCATION: {
    // API-01-01: GET ALL PROVINCES
    PROVINCES: "/api/provinces",
    // API-01-02: GET COMMUNES BY PROVINCE
    COMMUNES_BY_PROVINCE: (provinceId: number | string) =>
      `/api/provinces/${provinceId}/communes`,
    // API-01-03: GET STATIONS BY COMMUNE
    STATIONS_BY_COMMUNE: (communeId: number | string) =>
      `/api/communes/${communeId}/stations`,
  },
  BOOKINGS: {
    /** `GET` — list of a customer's upcoming bookings (CONFIRMED/CHECKED_IN/WASHING). */
    UPCOMING: "api/bookings/upcoming",
    /** `GET` — list of a customer's past bookings (PAID/CANCELLED/NO_SHOW). */
    PAST: "/api/bookings/past",
    /** `GET` — full detail of a single booking. */
    DETAIL: (bookingId: number | string) => `/api/bookings/${bookingId}`,
  },
  BOOKING: {
    // API-02-01: GET BOOKING CONTEXT
    BOOKING_CONTEXT: (stationId: number | string) =>
      `/api/stations/${stationId}/booking-context`,
    // API-02-02: GET AVAILABLE SLOTS
    BOOKING_SLOTS: (stationId: number | string) =>
      `/api/stations/${stationId}/booking-slots`,
    // API-02-03: CREATE BOOKING
    CREATE_BOOKING: "/api/bookings",
    // API-02-04: PREVIEW BOOKING PRICE
    PREVIEW_PRICE: "/api/bookings/preview-price",
  },
};

/**
 * Centralised REST endpoint paths for the AutoCarWash backend.
 * Paths are relative to `axiosClient`'s `baseURL` (`/api`).
 */
export const API = {
  BOOKINGS: {
    /** `GET` — list of a customer's upcoming bookings (CONFIRMED/CHECKED_IN/WASHING). */
    UPCOMING: "/bookings/upcoming",
    /** `GET` — list of a customer's past bookings (PAID/CANCELLED/NO_SHOW). */
    PAST: "/bookings/past",
  },
};

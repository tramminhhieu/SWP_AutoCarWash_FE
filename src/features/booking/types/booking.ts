/**
 * Lifecycle status of a booking, as returned by the backend's
 * `BookingCardResponse.status` field.
 *
 * - `CONFIRMED` / `CHECKED_IN` / `WASHING` — appear in the "upcoming" list.
 * - `PAID` / `CANCELLED` / `NO_SHOW` — appear in the "past" list.
 */
export type BookingStatus =
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
  /** Primary key of the booking. Used internally as the React list `key`. */
  bookingId: number;
  /** Name of the booked service package, e.g. "Premium Wash". */
  serviceName: string;
  /** License plate of the vehicle being serviced, e.g. "51A-11111". */
  licensePlate: string;
  /** Vehicle brand, e.g. "Toyota". The backend does not provide a model/trim. */
  brandName: string;
  /** Vehicle color, e.g. "White". */
  color: string;
  /** Current lifecycle status of the booking. */
  status: BookingStatus;
  /** Appointment date, formatted `yyyy-MM-dd`. */
  appointmentDate: string;
  /** Start of the booked time slot, formatted `HH:mm:ss`. */
  startTime: string;
  /** End of the booked time slot, formatted `HH:mm:ss`. */
  endTime: string;
  /** Actions the customer may currently perform on this booking. */
  allowedActions: BookingAction[];
}

/**
 * Formats a backend `yyyy-MM-dd` date string into the long display form
 * used on the card, e.g. `"2023-10-18"` -> `"October 18, 2023"`.
 */
export function formatAppointmentDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Formats a backend `HH:mm:ss` time string into a 12-hour clock time,
 * e.g. `"09:30:00"` -> `"09:30 AM"`.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formats a backend start/end time pair into the display range used on the
 * card, e.g. `"09:30:00"`/`"09:45:00"` -> `"09:30 AM - 09:45 AM"`.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Formats a backend naive ISO-8601 `LocalDateTime` string (no timezone) into
 * a display datetime, e.g. `"2026-07-02T14:30:00"` -> `"Jul 2, 2026, 02:30 PM"`.
 */
export function formatCheckInTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Formats a VND amount, e.g. `150000` -> `"150.000 ₫"`. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

// Lưu tạm các lựa chọn của user ở BookingCreate vào sessionStorage (theo tab, mất khi đóng tab),
// để không bị mất khi navigate sang màn thanh toán QR rồi bấm back quay lại.
const DRAFT_KEY_PREFIX = "hydro_lux_booking_draft_";

export interface BookingDraft {
  vehicleId: number | null;
  serviceId: number | null;
  addonIds: number[];
  dateKey: string | null; // "yyyy-MM-dd"
  slotIds: number[] | null;
  voucherCode: string | null;
}

const draftKey = (stationId: number) => `${DRAFT_KEY_PREFIX}${stationId}`;

export const saveBookingDraft = (
  stationId: number,
  draft: BookingDraft,
): void => {
  sessionStorage.setItem(draftKey(stationId), JSON.stringify(draft));
};

export const loadBookingDraft = (stationId: number): BookingDraft | null => {
  const raw = sessionStorage.getItem(draftKey(stationId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
};

export const clearBookingDraft = (stationId: number): void => {
  sessionStorage.removeItem(draftKey(stationId));
};

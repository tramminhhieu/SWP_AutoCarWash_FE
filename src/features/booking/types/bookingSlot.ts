// ====== API-02-02: GET AVAILABLE SLOTS ======

export interface BookingSlot {
  available: boolean;
  startTime: string; // "12:00:00"
  endTime: string; // "12:45:00"
  slotIds: number[];
}

export interface GetAvailableSlotsRequest {
  servicePackageId: number;
  addonServiceIds: number[];
  appointmentDate: string; // "2026-06-18"
}

// errorCode riêng khi không còn slot trống trong ngày (theo API-02-02 case fail)
export const NO_AVAILABLE_SLOTS_FOR_DATE = "NO_AVAILABLE_SLOTS_FOR_DATE";

import type { BookingSlot } from "../types/bookingSlot";

interface SlotPickerProps {
  slots: BookingSlot[];
  selectedSlotIds: number[] | null;
  onSelectSlot: (slot: BookingSlot) => void;
  period: "AM" | "PM";
  onChangePeriod: (period: "AM" | "PM") => void;
  isLoading: boolean;
}

// Lưới giờ trống, lọc theo buổi sáng (AM, trước 12h) / chiều (PM, từ 12h),
// dùng trong BookingCreate sau khi user chọn 1 ngày trên calendar.
const SlotPicker = ({
  slots,
  selectedSlotIds,
  onSelectSlot,
  period,
  onChangePeriod,
  isLoading,
}: SlotPickerProps) => {
  // Lọc slot theo buổi: lấy giờ bắt đầu (HH) để so sánh, < 12 là AM
  const filteredSlots = slots.filter((slot) => {
    const hour = Number(slot.startTime.split(":")[0]);
    return period === "AM" ? hour < 12 : hour >= 12;
  });

  // Format "09:30:00" -> "9:30 AM"
  const formatTime = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = Number(hourStr);
    const suffix = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minuteStr} ${suffix}`;
  };

  const isSlotSelected = (slot: BookingSlot) => {
    if (!selectedSlotIds) return false;
    return (
      slot.slotIds.length === selectedSlotIds.length &&
      slot.slotIds.every((id) => selectedSlotIds.includes(id))
    );
  };

  return (
    <div>
      {/* Toggle AM/PM */}
      <div className="flex justify-end pb-3">
        <div className="flex rounded-lg border border-outline-variant p-0.5">
          <button
            type="button"
            onClick={() => onChangePeriod("AM")}
            className={`rounded-md px-3 py-1.5 text-label-md transition-colors ${
              period === "AM"
                ? "bg-surface-container-high text-on-surface"
                : "text-on-surface-variant"
            }`}
          >
            Morning (AM)
          </button>
          <button
            type="button"
            onClick={() => onChangePeriod("PM")}
            className={`rounded-md px-3 py-1.5 text-label-md transition-colors ${
              period === "PM"
                ? "bg-surface-container-high text-on-surface"
                : "text-on-surface-variant"
            }`}
          >
            Afternoon (PM)
          </button>
        </div>
      </div>

      {/* Lưới giờ */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-11 rounded-lg bg-surface-container-high animate-pulse"
            />
          ))}
        </div>
      ) : filteredSlots.length === 0 ? (
        <p className="py-6 text-center text-body-md text-on-surface-variant">
          Không có khung giờ trống trong buổi này. Vui lòng đổi buổi hoặc đổi
          ngày.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {filteredSlots.map((slot) => {
            const selected = isSlotSelected(slot);
            return (
              <button
                key={slot.slotIds.join("-")}
                type="button"
                disabled={!slot.available}
                onClick={() => onSelectSlot(slot)}
                className={`flex flex-col items-center rounded-lg border px-3 py-2.5 text-body-md font-medium transition-colors

                  ${
                    !slot.available
                      ? "cursor-not-allowed border-outline-variant bg-surface-container-low text-outline-variant opacity-50"
                      : selected
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40"
                  }`}
              >
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;

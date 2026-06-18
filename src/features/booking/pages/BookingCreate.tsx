import { useSearchParams } from "react-router-dom";

// PLACEHOLDER - trang Booking (bước 2): chọn dịch vụ/slot/addon/submit.
// Hiện tại chỉ để test redirect từ bước 1 (SelectStation) sang đúng route,
// và đọc đúng stationId từ query param. Nội dung thật sẽ làm ở task khác.
const BookingCreate = () => {
  const [searchParams] = useSearchParams();
  const stationId = searchParams.get("stationId");

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-container-max px-4 md:px-12">
        {/* Step indicator: 1. Location (đã qua) -> 2. Booking (đang active) */}
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
              1
            </span>
            <span className="text-body-md font-semibold text-on-surface-variant">
              Location
            </span>
          </div>

          <span className="h-px w-16 bg-outline-variant" />

          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-primary text-label-sm font-semibold text-on-primary">
              2
            </span>
            <span className="text-body-md font-semibold text-primary">
              Booking
            </span>
          </div>
        </div>

        <h1 className="font-headline text-headline-lg text-on-surface text-center">
          Book Your Service
        </h1>
        <p className="mt-3 text-center text-body-lg text-on-surface-variant">
          Đây là trang placeholder để test redirect. Nội dung thật (chọn xe, gói
          dịch vụ, slot, addon, voucher...) sẽ làm ở bước sau.
        </p>

        <div className="mt-8 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center">
          <p className="text-body-md text-on-surface-variant">
            stationId nhận được từ query param:
          </p>
          <p className="mt-2 text-headline-md text-primary">
            {stationId ?? "(không có stationId)"}
          </p>
        </div>
      </div>
    </main>
  );
};

export default BookingCreate;

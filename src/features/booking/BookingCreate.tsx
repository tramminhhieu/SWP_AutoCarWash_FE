import AddressSelector from "../components/AddressSelector";

// Trang "Find a Service Center" - bước 1 trong flow đặt lịch (chọn station).
// Toàn bộ logic cascading Province -> Commune -> Station nằm trong AddressSelector.
const BookingCreate = () => {
  return (
    <main className="bg-background">
      <div className="mx-auto max-w-container-max px-4 md:px-12">
        {/* Step indicator: 1. Location (đang active) -> 2. Booking */}
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
              1
            </span>
            <span className="text-body-md font-semibold text-primary">
              Location
            </span>
          </div>

          <span className="h-px w-16 bg-outline-variant" />

          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-label-sm font-semibold text-on-surface-variant">
              2
            </span>
            <span className="text-body-md font-semibold text-on-surface-variant">
              Booking
            </span>
          </div>
        </div>

        {/* Tiêu đề trang */}
        <div className="pb-6">
          <h1 className="font-headline text-headline-lg text-on-surface md:text-headline-xl">
            Find a Service Center
          </h1>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            Select your preferred location to view available time slots.
          </p>
        </div>

        <div className="pb-16">
          <AddressSelector />
        </div>
      </div>
    </main>
  );
};

export default BookingCreate;

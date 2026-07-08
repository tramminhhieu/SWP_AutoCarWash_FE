import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Car,
  Sparkles,
  Droplet,
  Wand2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Plus,
  Check,
  MapPin,
  Crown,
} from "lucide-react";
import Loading from "../../../components/ui/Loading";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import SlotPicker from "../components/SlotPicker";
import {
  getBookingContext,
  getAvailableSlots,
  previewPrice,
  createBooking,
} from "../api/bookingApi";
import type {
  BookingContext,
  BookingVehicle,
  BookingServicePackage,
  BookingAddonService,
  BookingVoucher,
} from "../types/booking";
import { NO_VEHICLE_REGISTERED } from "../types/booking";
import type { BookingSlot } from "../types/bookingSlot";
import { getSubscriptionStyle } from "../../../constants/subscriptionStyles";

// Format số tiền VND, vd 110000 -> "110,000 VND"
const formatCurrency = (amount: number) =>
  `${amount.toLocaleString("en-US")} VND`;

// Icon minh họa cho 3 gói service theo thứ tự (Basic, Medium, Premium) - mockup dùng giọt nước,
// bọt xà phòng, và đũa thần tương ứng độ "cao cấp" tăng dần
const SERVICE_ICONS = [Droplet, Sparkles, Wand2];

// Sinh danh sách 7 ngày liên tiếp bắt đầu từ 1 ngày gốc, dùng cho calendar tuần
const generateWeekDays = (startDate: Date) => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const BookingCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stationId = Number(searchParams.get("stationId"));

  // --- State load booking context ---
  const [context, setContext] = useState<BookingContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [isNoVehicleError, setIsNoVehicleError] = useState(false);

  // --- State các lựa chọn của user ---
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null,
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  // --- State slots ---
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // --- State voucher ---
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(
    null,
  );
  const [applyingVoucherCode, setApplyingVoucherCode] = useState<string | null>(
    null,
  );
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // --- State giá tiền preview từ BE (chỉ có khi đã apply voucher) ---
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number | null>(null);
  const [subscriptionUsedToday, setSubscriptionUsedToday] = useState<
    boolean | null
  >(null);

  const [contextRefresh] = useState(0);

  // --- State submit booking (gọi API tạo booking) ---
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Load booking context khi vào trang
  useEffect(() => {
    if (!stationId) return;
    let cancelled = false;

    (async () => {
      setIsLoadingContext(true);
      setContextError(null);
      setIsNoVehicleError(false);
      try {
        const data = await getBookingContext(stationId);
        if (cancelled) return;
        setContext(data);
        setWeekStart(new Date(data.bookingWindow.minDate));
      } catch (error) {
        if (cancelled) return;
        const { errorCode, message: beMessage } = getApiErrorInfo(error);
        if (errorCode === NO_VEHICLE_REGISTERED) {
          setIsNoVehicleError(true);
          setContextError(
            beMessage ??
              "You have no vehicles. Please add a vehicle before booking.",
          );
        } else {
          setContextError(
            beMessage ??
              "Unable to load booking information. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingContext(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stationId, contextRefresh]);

  const loadSlots = async (
    date: Date,
    serviceId: number,
    addonIds: number[],
  ) => {
    setSelectedSlot(null);
    setSlots([]);
    setSlotsError(null);
    setIsLoadingSlots(true);
    try {
      const data = await getAvailableSlots(stationId, {
        servicePackageId: serviceId,
        addonServiceIds: addonIds,
        appointmentDate: formatDateKey(date),
      });
      setSlots(data);
    } catch {
      setSlotsError(
        "No available time slots for the selected date. Please choose a different date, station, or service package.",
      );
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const selectedVehicle =
    context?.vehicles?.find((v) => v.id === selectedVehicleId) ?? null;
  const selectedService =
    context?.servicePackages?.find((s) => s.id === selectedServiceId) ?? null;
  const selectedAddons = useMemo(
    () =>
      context?.addonServices?.filter((a) => selectedAddonIds.includes(a.id)) ??
      [],
    [context?.addonServices, selectedAddonIds],
  );

  // Xe đã chọn nếu có activeSubscription (UNLIMITED/FAMILY) khớp đúng servicePackageId
  // thì gói đó được tính 0đ (theo note FE trong API-02-01: so sánh ở FE, không gọi lại API)
  const isServiceCoveredBySubscription = (
    vehicle: BookingVehicle | null,
    serviceId: number,
  ) => vehicle?.activeSubscription?.servicePackageId === serviceId;

  // Gói chỉ miễn phí 1 lần/ngày. Xác định gói đã bị dùng cho NGÀY ĐANG CHỌN hay chưa,
  // ưu tiên theo thứ tự:
  // 1) subscriptionUsedToday !== null -> BE đã xác nhận qua preview-price (đúng theo
  //    appointmentDate đã gửi lên, là nguồn chính xác nhất)
  // 2) Chưa gọi preview-price -> tạm dùng mảng "usedDates" có sẵn từ booking-context,
  //    so ngày đang chọn có nằm trong mảng không -> biết ngay, không cần gọi thêm API,
  //    áp dụng được cho mọi ngày trong bookingWindow (hôm nay, ngày mai,...)
  const isSubscriptionConsumedForSelectedDate = (
    vehicle: BookingVehicle | null,
  ) => {
    if (subscriptionUsedToday !== null) return subscriptionUsedToday;
    if (!selectedDate) return false;
    const selectedDateKey = formatDateKey(selectedDate);
    return !!vehicle?.activeSubscription?.usedDates.includes(selectedDateKey);
  };

  const isSelectedServiceFree = !!(
    selectedService &&
    isServiceCoveredBySubscription(selectedVehicle, selectedService.id) &&
    !isSubscriptionConsumedForSelectedDate(selectedVehicle)
  );

  // Tổng tiền tự tính ở FE (basePrice + addon đã chọn), dùng làm fallback khi chưa apply voucher
  // Giá gói = 0 nếu gói đang được subscription của xe cover
  const computedSubTotal = useMemo(() => {
    const servicePrice = selectedService
      ? isServiceCoveredBySubscription(selectedVehicle, selectedService.id) &&
        !isSubscriptionConsumedForSelectedDate(selectedVehicle)
        ? 0
        : selectedService.basePrice
      : 0;
    const addonPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    return servicePrice + addonPrice;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedService,
    selectedAddons,
    selectedVehicle,
    subscriptionUsedToday,
    selectedDate,
  ]);

  // Tổng hiển thị cuối: nếu đã có previewTotal (từ API sau khi apply voucher) thì dùng nó,
  // ngược lại dùng số tự tính ở FE
  const displayTotal = previewTotal ?? computedSubTotal;

  // Chọn lại service/addon thì preview cũ (đã tính theo voucher) không còn đúng nữa -> reset
  const handleSelectService = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setPreviewTotal(null);
    setAppliedVoucherCode(null);
    setVoucherDiscount(null);

    // Gói mới có thể đã bao gồm sẵn 1 số add-on -> bỏ các add-on đó khỏi lựa chọn
    // hiện tại. Nếu không, chúng vẫn bị gửi lên API và cộng tiền dù đã bị ẩn khỏi UI.
    const includedAddonIds =
      context?.servicePackages.find((s) => s.id === serviceId)
        ?.addonServiceIds ?? [];
    const nextAddonIds = selectedAddonIds.filter(
      (id) => !includedAddonIds.includes(id),
    );
    if (nextAddonIds.length !== selectedAddonIds.length) {
      setSelectedAddonIds(nextAddonIds);
    }

    if (selectedDate) {
      loadSlots(selectedDate, serviceId, nextAddonIds);
    }
  };

  const handleToggleAddon = (addonId: number) => {
    const newAddonIds = selectedAddonIds.includes(addonId)
      ? selectedAddonIds.filter((id) => id !== addonId)
      : [...selectedAddonIds, addonId];
    setSelectedAddonIds(newAddonIds);
    setPreviewTotal(null);
    setAppliedVoucherCode(null);
    setVoucherDiscount(null);
    if (selectedDate && selectedServiceId) {
      loadSlots(selectedDate, selectedServiceId, newAddonIds);
    }
  };

  // Bấm chọn 1 ngày trên calendar -> gọi API lấy slot (chỉ gọi lúc này, không gọi trước)
  const handleSelectDate = async (date: Date) => {
    setSelectedDate(date);
    setSubscriptionUsedToday(null);
    if (!selectedServiceId) {
      setSelectedSlot(null);
      setSlots([]);
      setSlotsError(
        "Please select a service package before viewing time slots.",
      );
      return;
    }
    await loadSlots(date, selectedServiceId, selectedAddonIds);
  };

  // Bấm Apply voucher -> gọi preview-price để BE tính discount chính xác
  const handleToggleVoucher = async (voucher: BookingVoucher) => {
    if (appliedVoucherCode === voucher.voucherCode) {
      setAppliedVoucherCode(null);
      setPreviewTotal(null);
      setVoucherDiscount(null);
      setSubscriptionUsedToday(null);
      return;
    }

    if (!selectedVehicleId) {
      setVoucherError("Please select a vehicle before choosing a voucher.");
      return;
    }
    if (!selectedServiceId) {
      setVoucherError(
        "Please select a service package before choosing a voucher.",
      );
      return;
    }
    setApplyingVoucherCode(voucher.voucherCode);
    setVoucherError(null);
    try {
      const result = await previewPrice({
        stationId,
        vehicleId: selectedVehicleId,
        servicePackageId: selectedServiceId,
        addonServiceIds: selectedAddonIds,
        appointmentDate: formatDateKey(selectedDate!),
        voucherCode: voucher.voucherCode,
      });

      setPreviewTotal(result.breakdown.finalTotal);
      setVoucherDiscount(result.breakdown.voucherDiscount);
      setAppliedVoucherCode(voucher.voucherCode);
      setSubscriptionUsedToday(result.isVehicleBookingOnDateAndHasSubscription);
    } catch {
      setVoucherError(
        "Your order does not meet the criteria for applying this voucher.",
      );
    } finally {
      setApplyingVoucherCode(null);
    }
  };

  const weekDays = useMemo(() => generateWeekDays(weekStart), [weekStart]);

  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const canSubmit =
    !!selectedVehicleId &&
    !!selectedServiceId &&
    !!selectedDate &&
    !!selectedSlot &&
    !isBookingSubmitting;

  // Bấm Confirm Booking -> gọi API tạo booking thật, thành công thì chuyển về Home
  // kèm thông báo qua route state (giống pattern login thành công ở Login.tsx)
  const handleConfirmBooking = async () => {
    if (
      !selectedVehicleId ||
      !selectedServiceId ||
      !selectedDate ||
      !selectedSlot
    ) {
      return;
    }

    setBookingError(null);
    setIsBookingSubmitting(true);
    try {
      const result = await createBooking({
        stationId,
        vehicleId: selectedVehicleId,
        servicePackageId: selectedServiceId,
        addonServiceIds: selectedAddonIds,
        appointmentDate: formatDateKey(selectedDate),
        slotIds: selectedSlot.slotIds,
        voucherCode: appliedVoucherCode ?? undefined,
      });

      navigate("/", {
        state: {
          bookingSuccessMessage: `Booking confirmed! Booking ID: ${result.bookingId}.`,
        },
      });
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setBookingError(message ?? "Failed to create booking. Please try again.");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  if (isLoadingContext) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-container-max px-4 py-16 md:px-12">
          <Loading rows={6} />
        </div>
      </main>
    );
  }

  if (contextError || !context) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-container-max px-4 py-16 md:px-12 text-center">
          <p className="text-body-lg text-error">
            {contextError ?? "Booking information not found."}
          </p>
          {isNoVehicleError && (
            <button
              type="button"
              onClick={() =>
                navigate("/vehicles/add", { state: { stationId } })
              }
              className="mt-5 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90"
            >
              Add Vehicle
            </button>
          )}
        </div>
      </main>
    );
  }
  // Chống crash nếu BE trả null cho các field danh sách thay vì [] (đúng ra theo
  // API-02-01, case SUCCESS thì các field này luôn phải là array, có thể rỗng)
  const vehicles = context.vehicles ?? [];
  const servicePackages = context.servicePackages ?? [];
  const addonServices = context.addonServices ?? [];
  const vouchers = context.vouchers ?? [];

  // Add-on đã được gói đang chọn bao gồm sẵn thì ẩn khỏi danh sách "thêm dịch vụ".
  // Chưa chọn gói -> chưa biết gói bao gồm gì -> hiện tất cả.
  const includedAddonIds = selectedService?.addonServiceIds ?? [];
  const visibleAddons = addonServices.filter(
    (a) => !includedAddonIds.includes(a.id),
  );

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-container-max px-4 md:px-12">
        {/* Step indicator: 1. Location (đã qua) -> 2. Booking (đang active) */}
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-body-md font-semibold text-on-surface">
              Location
            </span>
          </div>
          <span className="h-px w-16 bg-outline-variant" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
              2
            </span>
            <span className="text-body-md font-semibold text-primary">
              Booking
            </span>
          </div>
        </div>

        {/* Tiêu đề trang */}
        <div className="pb-8">
          <h1 className="font-headline text-headline-lg text-on-surface md:text-headline-xl">
            Book Your Service
          </h1>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            Select your vehicle, choose a service package, and pick a time.
            We'll handle the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 pb-16 lg:grid-cols-[1fr_360px]">
          {/* ===== CỘT TRÁI: các bước chọn ===== */}
          <div className="flex flex-col gap-8">
            {/* BƯỚC 1: Select Vehicle */}
            <section>
              <div className="flex items-center gap-2 pb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                  1
                </span>
                <h2 className="text-headline-md text-on-surface">
                  Select Vehicle
                </h2>
              </div>

              {vehicles.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">
                  You have no vehicles. Please add a vehicle before
                  booking.{" "}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {vehicles.map((vehicle) => (
                    <VehicleOption
                      key={vehicle.id}
                      vehicle={vehicle}
                      isSelected={vehicle.id === selectedVehicleId}
                      subscriptionType={
                        vehicle.activeSubscription?.type ?? null
                      }
                      onSelect={() => {
                        setSelectedVehicleId(vehicle.id);
                        setPreviewTotal(null);
                        setSubscriptionUsedToday(null);

                        if (selectedDate && selectedServiceId) {
                          loadSlots(
                            selectedDate,
                            selectedServiceId,
                            selectedAddonIds,
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* BƯỚC 2: Choose Service */}
            <section>
              <div className="flex items-center gap-2 pb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                  2
                </span>
                <h2 className="text-headline-md text-on-surface">
                  Choose Service
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {servicePackages.map((service, idx) => (
                  <ServiceOption
                    key={service.id}
                    service={service}
                    icon={SERVICE_ICONS[idx % SERVICE_ICONS.length]}
                    isSelected={service.id === selectedServiceId}
                    isCovered={
                      isServiceCoveredBySubscription(
                        selectedVehicle,
                        service.id,
                      ) &&
                      !isSubscriptionConsumedForSelectedDate(selectedVehicle)
                    }
                    onSelect={() => handleSelectService(service.id)}
                  />
                ))}
              </div>
            </section>

            {/* BƯỚC 3: Enhance Your Service (addon) */}
            {visibleAddons.length > 0 && (
              <section>
                <div className="flex items-center gap-2 pb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                    3
                  </span>
                  <h2 className="text-headline-md text-on-surface">
                    Enhance Your Service
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {visibleAddons.map((addon) => (
                    <AddonOption
                      key={addon.id}
                      addon={addon}
                      isSelected={selectedAddonIds.includes(addon.id)}
                      onToggle={() => handleToggleAddon(addon.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* BƯỚC 4: Schedule */}
            <section>
              <div className="flex items-center gap-2 pb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                  4
                </span>
                <h2 className="text-headline-md text-on-surface">Schedule</h2>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                {/* Header tháng + nút chuyển tuần */}
                <div className="flex items-center justify-between pb-4">
                  <span className="text-body-lg font-semibold text-on-surface">
                    {weekStart.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={goToPrevWeek}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextWeek}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* 7 ngày trong tuần */}
                <div className="grid grid-cols-7 gap-2 pb-5">
                  {weekDays.map((day) => {
                    const isSelected =
                      selectedDate &&
                      formatDateKey(day) === formatDateKey(selectedDate);
                    const isOutOfWindow =
                      formatDateKey(day) < context.bookingWindow.minDate ||
                      formatDateKey(day) > context.bookingWindow.maxDate;

                    return (
                      <button
                        key={formatDateKey(day)}
                        type="button"
                        disabled={isOutOfWindow}
                        onClick={() => handleSelectDate(day)}
                        className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition-colors
                          ${
                            isOutOfWindow
                              ? "cursor-not-allowed opacity-30"
                              : isSelected
                                ? "bg-primary text-on-primary"
                                : "text-on-surface hover:bg-surface-container-low"
                          }`}
                      >
                        <span className="text-label-sm uppercase tracking-wide opacity-80">
                          {WEEKDAY_LABELS[day.getDay()]}
                        </span>
                        <span className="text-body-lg font-bold">
                          {day.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Lưới giờ trống, chỉ hiện sau khi đã chọn ngày */}
                {selectedDate && (
                  <div className="border-t border-outline-variant pt-5">
                    <p className="pb-3 text-body-lg font-semibold text-on-surface">
                      {selectedDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>

                    {slotsError ? (
                      <p className="text-body-md text-error">{slotsError}</p>
                    ) : (
                      <SlotPicker
                        slots={slots}
                        selectedSlotIds={selectedSlot?.slotIds ?? null}
                        onSelectSlot={setSelectedSlot}
                        period={period}
                        onChangePeriod={setPeriod}
                        isLoading={isLoadingSlots}
                      />
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* BƯỚC 7: Promotion Voucher (giữ đúng số 7 theo mockup) */}
            {vouchers.length > 0 && (
              <section>
                <div className="flex items-center gap-2 pb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                    7
                  </span>
                  <h2 className="text-headline-md text-on-surface">
                    Promotion Voucher
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {vouchers.map((voucher) => (
                    <VoucherOption
                      key={voucher.id}
                      voucher={voucher}
                      isApplied={appliedVoucherCode === voucher.voucherCode}
                      isApplying={applyingVoucherCode === voucher.voucherCode}
                      onToggle={() => handleToggleVoucher(voucher)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ===== CỘT PHẢI: Order Summary ===== */}
          <aside className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] lg:sticky lg:top-24">
            <div className="flex items-center gap-2 pb-5">
              <Calendar size={18} className="text-primary" />
              <h2 className="text-headline-md text-on-surface">
                Order Summary
              </h2>
            </div>

            {selectedService ? (
              <div className="flex items-start justify-between gap-2 pb-3">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">
                    {selectedService.name}
                  </p>
                  {selectedVehicle && (
                    <p className="text-body-md text-on-surface-variant">
                      {selectedVehicle.brandName} •{" "}
                      {selectedVehicle.licensePlate}
                    </p>
                  )}
                  {/* Địa chỉ station đã chọn ở bước trước (API-02-01 trả thêm field address) */}
                  {context.station && (
                    <div className="text-body-sm font-semibold text-on-surface">
                      <p className="text-on-surface">
                        {context.station.stationName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 text-primary font-medium">
                        <MapPin size={14} className="shrink-0" />
                        <span>{context.station.address}</span>
                      </div>
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-body-lg font-semibold text-on-surface">
                  {isSelectedServiceFree ? (
                    <>
                      <span className="mr-1.5 text-on-surface-variant line-through">
                        {formatCurrency(selectedService.basePrice)}
                      </span>
                      <span className="text-tertiary">0 VND</span>
                    </>
                  ) : (
                    formatCurrency(selectedService.basePrice)
                  )}
                </span>
              </div>
            ) : (
              <p className="pb-3 text-body-md text-on-surface-variant">
                No service selected
              </p>
            )}

            {selectedAddons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between gap-2 pb-3"
              >
                <p className="text-body-md font-medium text-on-surface">
                  {addon.name}
                </p>
                <span className="text-body-md font-medium text-on-surface">
                  {formatCurrency(addon.price)}
                </span>
              </div>
            ))}

            {selectedDate && selectedSlot && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-body-md text-on-surface">
                <Calendar size={16} className="text-on-surface-variant" />
                <span>
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" • "}
                  {selectedSlot.startTime.slice(0, 5)} –{" "}
                  {selectedSlot.endTime.slice(0, 5)}
                </span>
              </div>
            )}

            <div className="my-5 border-t border-outline-variant" />

            {/* Subtotal */}
            <div className="flex items-center justify-between pb-2">
              <span className="text-body-md text-on-surface-variant">
                Subtotal
              </span>
              <span className="text-body-md text-on-surface">
                {formatCurrency(computedSubTotal)}
              </span>
            </div>

            {/* Discount - chỉ hiện khi đã apply voucher */}
            {voucherDiscount != null && voucherDiscount > 0 && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-body-md text-on-surface-variant">
                  Discount ({appliedVoucherCode})
                </span>
                <span className="text-body-md text-error">
                  -{formatCurrency(voucherDiscount)}
                </span>
              </div>
            )}

            <div className="mt-3 mb-5 border-t border-outline-variant" />

            {/* Final total */}
            <div className="flex items-center justify-between pb-6">
              <span className="text-body-lg font-semibold text-on-surface">
                Total
              </span>
              <span className="text-headline-md text-primary">
                {formatCurrency(displayTotal)}
              </span>
            </div>
            {bookingError && (
              <p className="mb-3 text-body-md text-error">{bookingError}</p>
            )}
            {voucherError && (
              <p className="mt-3 text-body-md text-error text-center pb-3">
                {voucherError}
              </p>
            )}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleConfirmBooking}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors
                ${
                  canSubmit
                    ? "bg-primary text-on-primary hover:opacity-90"
                    : "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                }`}
            >
              {isBookingSubmitting ? "Processing..." : "Confirm Booking →"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

// ============ Sub-component: Vehicle option (chọn xe) ============
const VehicleOption = ({
  vehicle,
  isSelected,
  subscriptionType,
  onSelect,
}: {
  vehicle: BookingVehicle;
  isSelected: boolean;
  subscriptionType: "UNLIMITED" | "FAMILY" | null;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex items-center gap-3 rounded-xl p-4 text-left transition-colors
      ${
        isSelected
          ? "border-2 border-primary bg-primary-container/10"
          : "border border-outline-variant bg-surface-container-lowest hover:border-primary/40"
      }`}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
      <Car size={18} />
    </span>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-body-lg font-semibold text-on-surface">
          {vehicle.brandName}
        </p>
        {subscriptionType &&
          (() => {
            const style = getSubscriptionStyle(subscriptionType);
            return (
              <span
                className={`rounded-full border px-2 py-0.5 text-label-sm font-semibold ${style.badge} ${style.border}`}
              >
                {subscriptionType}
              </span>
            );
          })()}
      </div>
      <p className="text-body-md text-on-surface-variant">
        {vehicle.licensePlate}
      </p>
    </div>
    {isSelected && (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
        <Check size={12} strokeWidth={3} />
      </span>
    )}
  </button>
);

// ============ Sub-component: Service option (chọn gói dịch vụ) ============
const ServiceOption = ({
  service,
  icon: Icon,
  isSelected,
  isCovered,
  onSelect,
}: {
  service: BookingServicePackage;
  icon: typeof Droplet;
  isSelected: boolean;
  isCovered: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`relative rounded-xl p-4 text-left transition-colors
      ${
        isSelected
          ? "border-2 border-primary bg-primary-container/5"
          : "border border-outline-variant bg-surface-container-lowest hover:border-primary/40"
      }`}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-fixed text-secondary">
      <Icon size={18} />
    </span>
    <p className="mt-3 text-body-lg font-semibold text-on-surface">
      {service.name}
    </p>
    <p className="text-body-md text-on-surface-variant">
      {service.durationMinutes} min
    </p>
    <p className="mt-2 text-headline-md text-primary">
      {isCovered ? (
        <>
          <span className="mr-2 text-body-lg font-medium text-on-surface-variant line-through">
            {formatCurrency(service.basePrice)}
          </span>
          <span className="text-tertiary">0 VND</span>
        </>
      ) : (
        formatCurrency(service.basePrice)
      )}
    </p>
    {/* FE-55-US-01 AC03: hiển thị icon Membership trên service package được áp dụng
        quyền lợi (trước đây chỉ có text "Included in your package", chưa có icon riêng) */}
    {isCovered && (
      <p className="mt-1 flex items-center gap-1 text-label-sm font-semibold text-tertiary">
        <Crown size={13} />
        Included in your package
      </p>
    )}
  </button>
);

// ============ Sub-component: Addon option (chọn dịch vụ thêm) ============
const AddonOption = ({
  addon,
  isSelected,
  onToggle,
}: {
  addon: BookingAddonService;
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-center gap-3 rounded-xl p-4 text-left transition-colors
      ${
        isSelected
          ? "border-2 border-primary bg-primary-container/10"
          : "border border-outline-variant bg-surface-container-lowest hover:border-primary/40"
      }`}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
      <Sparkles size={18} />
    </span>
    <div className="flex-1">
      <p className="text-body-lg font-semibold text-on-surface">{addon.name}</p>
      <p className="text-body-md text-on-surface-variant">
        +{addon.durationMinutes} min
      </p>
      <p className="text-body-md font-medium text-primary">
        +{formatCurrency(addon.price)}
      </p>
    </div>
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2
        ${isSelected ? "border-primary bg-primary text-on-primary" : "border-outline-variant"}`}
    >
      {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
    </span>
  </button>
);

// ============ Sub-component: Voucher option ============
const VoucherOption = ({
  voucher,
  isApplied,
  isApplying,
  onToggle,
}: {
  voucher: BookingVoucher;
  isApplied: boolean;
  isApplying: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={isApplying}
    className={`w-full rounded-xl p-4 text-left transition-colors
      ${
        isApplied
          ? "border-2 border-primary bg-primary-container/10"
          : "border border-outline-variant bg-surface-container-lowest hover:border-primary/40"
      }`}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-fixed text-secondary">
      <Ticket size={18} />
    </span>
    <p className="mt-3 text-body-lg font-semibold text-on-surface">
      {voucher.discountPercentage}% Off - {voucher.voucherCode}
    </p>
    <p className="text-body-md text-on-surface-variant">
      Min order {formatCurrency(voucher.minOrderValue)}
    </p>
    <p
      className={`mt-2 text-label-md font-semibold ${isApplied ? "text-primary" : "text-on-surface-variant"}`}
    >
      {isApplying
        ? "Applying..."
        : isApplied
          ? "Selected ✓"
          : "Click to select"}
    </p>
  </button>
);

export default BookingCreate;

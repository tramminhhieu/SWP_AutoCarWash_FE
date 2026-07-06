//author: Ngọc
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, Check, X, User, Star, Plus, Calendar, Car } from "lucide-react";
import {
  checkPhone,
  calculateInvoice,
  createWalkIn,
  getWalkInFormData,
  type CheckPhoneResponse,
  type SavedVehicleDTO,
  type BookingSummaryResponse,
  type WalkInServicePackageDTO,
  type WalkInAddonServiceDTO,
} from "../services/walkInApi";
// ported onto dev: dev không có utils/currency.ts, dùng formatCurrency của dev thay formatVND
import { formatCurrency as formatVND } from "../../../utils/format";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getSubscriptionStyle } from "../../../constants/subscriptionStyles";
import { useAuth } from "../../../hooks/useAuth";
import Modal from "../../../components/ui/Modal";

const SLOT_DURATION_MINUTES = 15; // 1 requiredSlot = 15 phút, theo comment BE WalkInFormDataResponse

type CustomerType = "GUEST" | "MEMBER";
type Step = "select-type" | "booking-form" | "done";

interface VehicleInfo {
  licensePlate: string;
  brandName: string;
  color: string;
  customerId?: number;
  existingVehicleId?: number;
  customerName?: string;
  tierName?: string;
}

// Khối giờ đúng bằng tổng thời gian service + addon đã chọn — BE (calculate-invoice) đã tự
// gộp các slot 15 phút liên tiếp thành từng khối rồi (sliding window theo capacity thực tế),
// mỗi phần tử trong summary.availableSlots đã là 1 khối sẵn sàng chọn, kèm associatedSlotIds
// là danh sách slotId đầy đủ cần gửi lên khi confirm. FE không tự gộp lại nữa.
interface SlotWindow {
  slotIds: number[];
  startTime: string;
  endTime: string;
}

export default function WalkInPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stationId = user?.stationId;
  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [step, setStep] = useState<Step>("select-type");

  // MEMBER phone lookup
  const [phone, setPhone] = useState("");
  const [phoneResult, setPhoneResult] = useState<CheckPhoneResponse | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);

  // vehicle info
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    licensePlate: "",
    brandName: "",
    color: "",
  });
  const [selectedSavedVehicle, setSelectedSavedVehicle] = useState<SavedVehicleDTO | null>(null);

  // service selection
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [summary, setSummary] = useState<BookingSummaryResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotWindow | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  // Staff xác nhận ĐÃ thu tiền cọc phạt tại quầy (xe vãng lai bị restricted) qua popup —
  // bắt buộc trước khi được phép đưa xe vào hàng đợi, theo đúng 2 nhánh xử lý bên BE.
  const [depositCollected, setDepositCollected] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositReceivedInput, setDepositReceivedInput] = useState("");
  const [depositModalError, setDepositModalError] = useState("");

  // schedule: lọc slot của hôm nay theo buổi sáng/chiều, giống booking
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // result
  const [ticketNumber, setTicketNumber] = useState("");
  const [remainingBalance, setRemainingBalance] = useState(0);

  // service package / addon options (mock — xem walkInApi.ts để biết API thật đề xuất)
  const [servicePackages, setServicePackages] = useState<WalkInServicePackageDTO[]>([]);
  const [addonServices, setAddonServices] = useState<WalkInAddonServiceDTO[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    getWalkInFormData()
      .then((data) => {
        setServicePackages(data.servicePackages);
        setAddonServices(data.addonServices);
      })
      .finally(() => setIsLoadingOptions(false));
  }, []);

  // vehicleInfo/service/schedule state dùng chung cho cả GUEST và MEMBER -> phải dọn sạch
  // mỗi khi đổi loại khách hàng, nếu không giá trị của loại trước sẽ còn sót lại.
  const resetBookingForm = () => {
    setPhone("");
    setPhoneResult(null);
    setPhoneError("");
    setVehicleInfo({ licensePlate: "", brandName: "", color: "" });
    setSelectedSavedVehicle(null);
    setSelectedServiceId(null);
    setSelectedAddonIds([]);
    setSummary(null);
    setSelectedSlot(null);
    setConfirmError(null);
    setPeriod("AM");
    setDepositCollected(false);
    setShowDepositModal(false);
    setDepositReceivedInput("");
    setDepositModalError("");
  };

  const handleSelectType = (type: CustomerType) => {
    resetBookingForm();
    setCustomerType(type);
    setStep("booking-form");
  };

  const handlePhoneSearch = async () => {
    if (!phone.trim()) return;
    setIsPhoneLoading(true);
    setPhoneError("");
    setPhoneResult(null);
    try {
      const result = await checkPhone(phone.trim());
      if (result.existed) {
        setPhoneResult(result);
        setVehicleInfo((prev) => ({
          ...prev,
          customerId: result.customerId,
          customerName: result.customerName,
          tierName: result.tierName,
        }));
      } else {
        setPhoneError("No account found with this phone number.");
      }
    } catch {
      setPhoneError("Connection error, please try again.");
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleSelectSavedVehicle = (v: SavedVehicleDTO) => {
    setSelectedSavedVehicle(v);
    setVehicleInfo((prev) => ({
      ...prev,
      licensePlate: v.licensePlate,
      brandName: v.brandName,
      color: v.color,
      existingVehicleId: v.id,
    }));
    setDepositCollected(false);
  };

  const recalcInvoice = async (serviceId: number, addonIds: number[]) => {
    setSelectedSlot(null);
    setSummary(null);
    if (!vehicleInfo.licensePlate.trim() || !stationId) return;
    setIsCalculating(true);
    try {
      const result = await calculateInvoice({
        customerId: vehicleInfo.customerId,
        licensePlate: vehicleInfo.licensePlate,
        servicePackageId: serviceId,
        addonIds,
        stationId,
      });
      setSummary(result);
    } catch {
      setSummary(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectService = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    // Addons already bundled into the newly chosen package must not stay selected —
    // otherwise they'd be double-counted (once via package, once via addon).
    const newAddonIds = selectedAddonIds.filter(
      (id) => !addonServices.find((a) => a.id === id)?.includedInPackageIds.includes(serviceId)
    );
    setSelectedAddonIds(newAddonIds);
    recalcInvoice(serviceId, newAddonIds);
  };

  const handleToggleAddon = (addonId: number) => {
    const newAddonIds = selectedAddonIds.includes(addonId)
      ? selectedAddonIds.filter((id) => id !== addonId)
      : [...selectedAddonIds, addonId];
    setSelectedAddonIds(newAddonIds);
    if (selectedServiceId) {
      recalcInvoice(selectedServiceId, newAddonIds);
    }
  };

  const handleConfirmDeposit = () => {
    const requiredDeposit = summary?.penaltyDeposit ?? 0;
    const receivedAmount = Number(depositReceivedInput);
    if (!receivedAmount || receivedAmount < requiredDeposit) {
      setDepositModalError(`Please enter at least ${formatVND(requiredDeposit)}.`);
      return;
    }
    setDepositCollected(true);
    setShowDepositModal(false);
    setDepositModalError("");
  };

  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
    setDepositModalError("");
  };

  const handleConfirm = async () => {
    if (!selectedServiceId || !selectedSlot || !stationId) return;
    setIsSubmitting(true);
    setConfirmError(null);
    try {
      const result = await createWalkIn({
        customerId: vehicleInfo.customerId,
        existingVehicleId: vehicleInfo.existingVehicleId,
        licensePlate: vehicleInfo.licensePlate,
        brandName: vehicleInfo.brandName || undefined,
        color: vehicleInfo.color || undefined,
        servicePackageId: selectedServiceId,
        addonIds: selectedAddonIds,
        chosenSlotIds: selectedSlot.slotIds,
        stationId,
        penaltyDepositCollected: depositCollected,
      });
      setTicketNumber(result.ticketNumber);
      setRemainingBalance(result.remainingBalance);
      setStep("done");
    } catch (error) {
      const { errorCode, message } = getApiErrorInfo(error);
      setConfirmError(message ?? errorCode ?? "Failed to create walk-in, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gói dịch vụ đang được xe này miễn phí nhờ subscription (Unlimited/Family) đang ACTIVE —
  // dùng để hiển thị giá 0 VNĐ ngay tại card chọn gói, trước khi tính invoice.
  const freeServicePackageIds = new Set(
    selectedSavedVehicle?.subscriptionInfo?.map((sub) => sub.servicePackageId) ?? []
  );

  // Order summary computed values (booking-form step)
  const selectedService = servicePackages.find((p) => p.id === selectedServiceId) ?? null;
  const selectedAddons = addonServices.filter((a) => selectedAddonIds.includes(a.id));
  // Addons already bundled into the selected package are hidden from selection —
  // staff shouldn't be able to add (and double-charge) something already included.
  const selectableAddons = addonServices.filter(
    (a) => !selectedServiceId || !a.includedInPackageIds.includes(selectedServiceId)
  );
  const computedSubTotal =
    (selectedService?.basePrice ?? 0) + selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const displayTotal = summary?.remainingBalance ?? computedSubTotal;

  // Tổng thời gian = thời lượng gói dịch vụ + tổng thời lượng các addon đã chọn (chỉ để hiển thị)
  const totalDurationMinutes =
    (selectedService ? selectedService.requiredSlot * SLOT_DURATION_MINUTES : 0) +
    selectedAddons.reduce((sum, a) => sum + a.durationMinutes, 0);

  // summary.availableSlots đã là khối giờ hoàn chỉnh từ BE — map sang SlotWindow, dùng
  // associatedSlotIds làm slotIds thật để gửi lên khi confirm (không tự gộp lại ở FE).
  const slotWindows: SlotWindow[] = useMemo(
    () =>
      (summary?.availableSlots ?? []).map((s) => ({
        slotIds: s.associatedSlotIds,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    [summary?.availableSlots]
  );

  // Lọc khối giờ theo buổi sáng (AM, trước 12h) / chiều (PM, từ 12h)
  const filteredSlots = slotWindows.filter((window) => {
    const hour = Number(window.startTime.split(":")[0]);
    return period === "AM" ? hour < 12 : hour >= 12;
  });

  const canConfirm =
    !!stationId &&
    vehicleInfo.licensePlate.trim() !== "" &&
    (customerType === "GUEST" || !!phoneResult?.existed) &&
    !!selectedServiceId &&
    !!selectedSlot &&
    !isSubmitting &&
    (!(summary?.actionBlock ?? false) || depositCollected);

  // Số thứ tự section: MEMBER có thêm bước "Member Lookup" trước "Select Vehicle"
  const sectionNum = {
    lookup: 1,
    vehicle: customerType === "MEMBER" ? 2 : 1,
    service: customerType === "MEMBER" ? 3 : 2,
    addons: customerType === "MEMBER" ? 4 : 3,
    schedule: customerType === "MEMBER" ? 5 : 4,
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`mx-auto flex flex-col gap-8 py-8 ${
          step === "booking-form" ? "max-w-container-max px-4 md:px-12" : "max-w-2xl px-4"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {step !== "select-type" && step !== "done" && (
              <button
                onClick={() => {
                  resetBookingForm();
                  setStep("select-type");
                }}
                className="rounded-full p-1.5 hover:bg-surface-container transition"
              >
                <ChevronLeft className="w-5 h-5 text-outline" />
              </button>
            )}
            <div>
              <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
                Walk-In Check-In
              </h1>
              <p className="text-body-md text-on-surface-variant mt-0.5">
                {step === "select-type" && "Select customer type"}
                {step === "booking-form" &&
                  (customerType === "MEMBER"
                    ? "Member lookup, service & confirmation"
                    : "Vehicle, service & confirmation")}
                {step === "done" && "Booking confirmed"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/staff/queue")}
            aria-label="Close, back to Queue Page"
            className="rounded-full p-1.5 hover:bg-surface-container transition"
          >
            <X className="w-5 h-5 text-outline" />
          </button>
        </div>

        {/* Step: Select type */}
        {step === "select-type" && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectType("GUEST")}
              className="flex flex-col items-start gap-3 rounded-[8px] border border-outline-variant/50 bg-white p-6 text-left shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)] transition hover:border-primary"
            >
              <div className="flex size-16 shrink-0 items-center justify-center rounded-[8px] border border-primary/10 bg-primary/5">
                <User className="size-6 text-primary" />
              </div>
              <p className="font-bold text-base text-on-surface">GUEST</p>
              <p className="text-body-md text-on-surface-variant">Walk-in customer, no account</p>
            </button>
            <button
              onClick={() => handleSelectType("MEMBER")}
              className="flex flex-col items-start gap-3 rounded-[8px] border border-outline-variant/50 bg-white p-6 text-left shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)] transition hover:border-primary"
            >
              <div className="flex size-16 shrink-0 items-center justify-center rounded-[8px] border border-primary/10 bg-primary/5">
                <Star className="size-6 text-primary" />
              </div>
              <p className="font-bold text-base text-on-surface">MEMBER</p>
              <p className="text-body-md text-on-surface-variant">Customer with a member account</p>
            </button>
          </div>
        )}

        {/* Step: Booking form (GUEST & MEMBER) — same section + sticky order summary layout as BookingCreate */}
        {step === "booking-form" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            {/* ===== LEFT: form sections ===== */}
            <div className="flex flex-col gap-8">
              {/* Member Lookup (MEMBER only) */}
              {customerType === "MEMBER" && (
                <section>
                  <div className="flex items-center gap-2 pb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                      {sectionNum.lookup}
                    </span>
                    <h2 className="text-headline-md text-on-surface">Member Lookup</h2>
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                    <div>
                      <label className="text-label-md font-semibold text-on-surface-variant mb-1.5 block">Phone Number</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                          placeholder="Enter phone number..."
                          className="flex-1 rounded-xl px-3 py-2.5 text-body-md border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                        />
                        <button
                          type="button"
                          onClick={handlePhoneSearch}
                          disabled={isPhoneLoading}
                          className="px-4 py-2.5 rounded-xl text-body-md font-semibold bg-primary text-on-primary disabled:opacity-50"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                      {phoneError && <p className="text-body-md text-error mt-1.5">{phoneError}</p>}
                    </div>
                    {phoneResult?.existed && (
                      <div className="flex items-center gap-2 rounded-xl p-3 bg-surface-container-low border border-outline-variant/30">
                        <p className="font-semibold text-body-md text-on-surface">{phoneResult.customerName}</p>
                        <span className="text-label-sm px-2 py-0.5 rounded-full font-medium bg-primary-fixed text-on-primary-fixed">
                          {phoneResult.tierName ?? "MEMBER"}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Select Vehicle (MEMBER: cards from saved vehicles, giống BookingCreate) / Vehicle Info (GUEST) */}
              <section>
                <div className="flex items-center gap-2 pb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                    {sectionNum.vehicle}
                  </span>
                  <h2 className="text-headline-md text-on-surface">
                    {customerType === "MEMBER" ? "Select Vehicle" : "Vehicle Info"}
                  </h2>
                </div>
                <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                  {customerType === "MEMBER" && phoneResult?.savedVehicles && phoneResult.savedVehicles.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {phoneResult.savedVehicles.map((v) => {
                        // BE (check-phone) chỉ trả subscriptionInfo gồm các gói Unlimited/Family đang
                        // ACTIVE và chưa hết hạn tính đến hôm nay -> có phần tử là xe đang được miễn phí.
                        const activeSubscriptions = v.subscriptionInfo ?? [];
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectSavedVehicle(v)}
                            className={`flex items-center gap-3 rounded-xl p-4 text-left transition-colors
                              ${
                                selectedSavedVehicle?.id === v.id
                                  ? "border-2 border-primary bg-primary-container/10"
                                  : "border border-outline-variant bg-surface-container-lowest hover:border-primary/40"
                              }`}
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                              <Car size={18} />
                            </span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-body-lg font-semibold text-on-surface">{v.brandName}</p>
                                {activeSubscriptions.map((sub) => {
                                  const style = getSubscriptionStyle(sub.planType);
                                  return (
                                    <span
                                      key={sub.subscriptionId}
                                      className={`rounded-full border px-2 py-0.5 text-label-sm font-semibold ${style.badge} ${style.border}`}
                                    >
                                      {sub.planName}
                                    </span>
                                  );
                                })}
                              </div>
                              <p className="text-body-md text-on-surface-variant">{v.licensePlate}</p>
                            </div>
                            {selectedSavedVehicle?.id === v.id && (
                              <Check size={18} className="text-primary shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {customerType === "MEMBER" && phoneResult?.savedVehicles && phoneResult.savedVehicles.length > 0 && (
                    <p className="text-label-md text-outline">— or enter a new license plate below —</p>
                  )}
                  <div>
                    <label className="text-label-md font-semibold text-on-surface-variant mb-1.5 block">
                      License Plate <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.licensePlate}
                      onChange={(e) => {
                        // Chuẩn hoá biển số ngay lúc nhập: viết hoa toàn bộ + bỏ khoảng trắng
                        // (kể cả khoảng trắng ở giữa) để tránh sai lệch khi so khớp/tra cứu
                        // theo chuỗi biển số ở BE (vd "51a 12345" và "51A-12345" là cùng 1 xe).
                        const normalizedPlate = e.target.value.toUpperCase().replace(/\s+/g, "");
                        setVehicleInfo((prev) => ({ ...prev, licensePlate: normalizedPlate, existingVehicleId: undefined }));
                        setSelectedSavedVehicle(null);
                        setDepositCollected(false);
                      }}
                      placeholder="e.g. 51A-12345"
                      className="w-full rounded-xl px-3 py-2.5 text-body-md border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                    />
                  </div>
                  {customerType === "MEMBER" && (
                    <div>
                      <label className="text-label-md font-semibold text-on-surface-variant mb-1.5 block">Brand</label>
                      <input
                        type="text"
                        value={vehicleInfo.brandName}
                        onChange={(e) => setVehicleInfo((prev) => ({ ...prev, brandName: e.target.value }))}
                        placeholder="e.g. Toyota"
                        className="w-full rounded-xl px-3 py-2.5 text-body-md border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                      />
                    </div>
                  )}
                  {customerType === "GUEST" && (
                    <div className="rounded-xl px-4 py-3 bg-surface-container border border-outline-variant/30">
                      <p className="text-body-md text-on-surface-variant">
                        Customer will be booked under the <span className="font-semibold text-on-surface">GUEST</span> tier — vouchers and discounts do not apply.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Choose Service */}
              <section>
                <div className="flex items-center gap-2 pb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                    {sectionNum.service}
                  </span>
                  <h2 className="text-headline-md text-on-surface">Choose Service</h2>
                </div>
                {isLoadingOptions && (
                  <p className="pb-2 text-body-md text-outline">Loading services...</p>
                )}
                {!isLoadingOptions && !vehicleInfo.licensePlate.trim() && (
                  <p className="pb-2 text-body-md text-on-surface-variant">
                    Enter a license plate above to choose a service.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {servicePackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleSelectService(pkg.id)}
                      disabled={!vehicleInfo.licensePlate.trim()}
                      className={`rounded-xl p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                          selectedServiceId === pkg.id
                            ? "border-2 border-primary bg-primary-container/5"
                            : "border border-outline-variant bg-surface-container-lowest hover:border-primary/40"
                        }`}
                    >
                      <p className="text-body-lg font-semibold text-on-surface">{pkg.name}</p>
                      <p className="text-body-md text-on-surface-variant">
                        {pkg.requiredSlot * SLOT_DURATION_MINUTES} min
                      </p>
                      {freeServicePackageIds.has(pkg.id) ? (
                        <p className="mt-2 flex items-baseline gap-2">
                          <span className="text-body-md text-on-surface-variant line-through">
                            {formatVND(pkg.basePrice)}
                          </span>
                          <span className="text-headline-md text-primary">0 VNĐ</span>
                        </p>
                      ) : (
                        <p className="mt-2 text-headline-md text-primary">{formatVND(pkg.basePrice)}</p>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Add-ons */}
              <section>
                <div className="flex items-center gap-2 pb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                    {sectionNum.addons}
                  </span>
                  <h2 className="text-headline-md text-on-surface">Add-ons</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectableAddons.map((addon) => (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => handleToggleAddon(addon.id)}
                      className={`flex items-center gap-3 rounded-xl p-4 text-left transition-colors
                        ${
                          selectedAddonIds.includes(addon.id)
                            ? "border-2 border-primary bg-primary-container/10"
                            : "border border-outline-variant bg-surface-container-lowest hover:border-primary/40"
                        }`}
                    >
                      <div className="flex-1">
                        <p className="text-body-lg font-semibold text-on-surface">{addon.name}</p>
                        <p className="text-body-md text-on-surface-variant">{addon.durationMinutes} min</p>
                        {addon.description && (
                          <p className="text-body-md text-on-surface-variant">{addon.description}</p>
                        )}
                        <p className="text-body-md font-medium text-primary">+{formatVND(addon.price)}</p>
                      </div>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2
                          ${selectedAddonIds.includes(addon.id) ? "border-primary bg-primary text-on-primary" : "border-outline-variant"}`}
                      >
                        {selectedAddonIds.includes(addon.id) ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Schedule */}
              {!!selectedServiceId && (
                <section>
                  <div className="flex items-center gap-2 pb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">
                      {sectionNum.schedule}
                    </span>
                    <h2 className="text-headline-md text-on-surface">Schedule</h2>
                    {totalDurationMinutes > 0 && (
                      <span className="ml-auto text-body-md text-on-surface-variant">
                        Total duration: <span className="font-semibold text-on-surface">{totalDurationMinutes} min</span>
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                    <p className="pb-4 text-body-md text-on-surface-variant">
                      Walk-in bookings are for today only — pick an available time slot below.
                    </p>

                    {/* Toggle AM/PM */}
                    <div className="flex justify-end pb-3">
                      <div className="flex rounded-lg border border-outline-variant p-0.5">
                        <button
                          type="button"
                          onClick={() => setPeriod("AM")}
                          className={`rounded-md px-3 py-1.5 text-label-md transition-colors ${
                            period === "AM" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant"
                          }`}
                        >
                          Morning (AM)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPeriod("PM")}
                          className={`rounded-md px-3 py-1.5 text-label-md transition-colors ${
                            period === "PM" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant"
                          }`}
                        >
                          Afternoon (PM)
                        </button>
                      </div>
                    </div>

                    {isCalculating ? (
                      <p className="text-center text-body-md text-outline">Calculating invoice...</p>
                    ) : filteredSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredSlots.map((slot) => (
                          <button
                            key={slot.slotIds.join("-")}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-1.5 rounded-lg text-body-md font-medium border transition ${
                              selectedSlot?.slotIds.join("-") === slot.slotIds.join("-")
                                ? "bg-primary text-on-primary border-primary"
                                : "bg-surface-container-lowest text-on-surface border-outline-variant hover:border-primary"
                            }`}
                          >
                            {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-md text-on-surface-variant">
                        No available time slots for this period. Try the other period.
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* ===== RIGHT: Order Summary ===== */}
            <aside className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] lg:sticky lg:top-24">
              <div className="flex items-center gap-2 pb-5">
                <Calendar size={18} className="text-primary" />
                <h2 className="text-headline-md text-on-surface">Order Summary</h2>
              </div>

              {selectedService ? (
                <div className="flex items-start justify-between gap-2 pb-3">
                  <div>
                    <p className="text-body-lg font-semibold text-on-surface">{selectedService.name}</p>
                    {vehicleInfo.licensePlate && (
                      <p className="text-body-md text-on-surface-variant">
                        {vehicleInfo.licensePlate}
                        {vehicleInfo.customerName ? ` • ${vehicleInfo.customerName}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-body-lg font-semibold text-on-surface">
                    {formatVND(selectedService.basePrice)}
                  </span>
                </div>
              ) : (
                <p className="pb-3 text-body-md text-on-surface-variant">No service selected</p>
              )}

              {selectedAddons.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between gap-2 pb-3">
                  <p className="text-body-md font-medium text-on-surface">{addon.name}</p>
                  <span className="text-body-md font-medium text-on-surface">{formatVND(addon.price)}</span>
                </div>
              ))}

              {selectedSlot && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-body-md text-on-surface">
                  <Calendar size={16} className="text-on-surface-variant" />
                  <span>
                    Today • {selectedSlot.startTime.slice(0, 5)} – {selectedSlot.endTime.slice(0, 5)}
                  </span>
                </div>
              )}

              <div className="my-5 border-t border-outline-variant" />

              {summary ? (
                <>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-body-md text-on-surface-variant">Base Price</span>
                    <span className="text-body-md text-on-surface">{formatVND(summary.rawAmount)}</span>
                  </div>
                  {summary.packageDiscount > 0 && (
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-body-md text-on-surface-variant">Package Discount</span>
                      <span className="text-body-md text-error">-{formatVND(summary.packageDiscount)}</span>
                    </div>
                  )}
                  {summary.penaltyDeposit > 0 && (
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-body-md text-error">Penalty Deposit</span>
                      <span className="text-body-md text-error">{formatVND(summary.penaltyDeposit)}</span>
                    </div>
                  )}
                  {summary.transferredCredit > 0 && (
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-body-md text-on-surface-variant">Transferred Credit</span>
                      <span className="text-body-md text-error">-{formatVND(summary.transferredCredit)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between pb-2">
                  <span className="text-body-md text-on-surface-variant">Subtotal</span>
                  <span className="text-body-md text-on-surface">{formatVND(computedSubTotal)}</span>
                </div>
              )}

              <div className="mt-3 mb-5 border-t border-outline-variant" />

              <div className="flex items-center justify-between pb-6">
                <span className="text-body-lg font-semibold text-on-surface">
                  {summary ? "Amount Due" : "Total"}
                </span>
                <span className="text-headline-md text-primary">{formatVND(displayTotal)}</span>
              </div>

              {summary?.systemNotice && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-body-md text-amber-700">
                  {summary.systemNotice}
                </p>
              )}
              {summary?.actionBlock && !depositCollected && (
                <div className="mb-3 flex flex-col gap-2 rounded-lg border border-error bg-error-container px-3 py-2">
                  <p className="text-body-md font-semibold text-on-error-container">
                    A {formatVND(summary.penaltyDeposit)} penalty deposit is required before confirming
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(true)}
                    className="w-full rounded-lg bg-error px-3 py-2 text-body-md font-semibold text-on-error hover:opacity-90"
                  >
                    Collect Penalty Deposit
                  </button>
                </div>
              )}
              {summary?.actionBlock && depositCollected && (
                <p className="mb-3 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-body-md font-semibold text-on-surface">
                  Penalty deposit collected — ready to confirm walk-in.
                </p>
              )}
              {confirmError && (
                <p className="mb-3 rounded-lg border border-error bg-error-container px-3 py-2 text-body-md font-semibold text-on-error-container">
                  {confirmError}
                </p>
              )}

              <button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirm}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors
                  ${
                    canConfirm
                      ? "bg-primary text-on-primary hover:opacity-90"
                      : "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                  }`}
              >
                {isSubmitting ? "Processing..." : "Confirm Walk-In →"}
              </button>
            </aside>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-1 rounded-[8px] border border-outline-variant/50 bg-white p-8 text-center shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)]">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-[8px] border border-primary/10 bg-primary/5 mb-3">
              <Check className="size-6 text-primary" />
            </div>
            <h2 className="text-headline-md text-on-surface mb-1">Booking Confirmed!</h2>
            <p className="text-body-md text-on-surface-variant mb-6">Vehicle is waiting for staff check-in at the counter</p>
            <div className="w-full rounded-xl p-6 bg-surface-container-low border border-outline-variant/30 mb-6">
              <p className="text-label-md font-semibold text-outline mb-1">Ticket Number</p>
              <p className="text-4xl font-bold text-primary tracking-widest">{ticketNumber}</p>
              <div className="border-t border-outline-variant mt-4 pt-4">
                <p className="text-body-md text-on-surface-variant">Remaining Balance</p>
                <p className="text-headline-md text-on-surface">{formatVND(remainingBalance)}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/staff/queue")}
              className="w-full py-3 rounded-xl text-body-md font-semibold bg-primary text-on-primary"
            >
              Back to Queue
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDepositModal}
        onClose={handleCloseDepositModal}
        variant="danger"
        title="Penalty Deposit Required"
        confirmText="Confirm Deposit Collected"
        onConfirm={handleConfirmDeposit}
        message={
          <div className="flex flex-col gap-3 text-left">
            <p>
              This vehicle has an active violation restriction. Staff must collect a{" "}
              {formatVND(summary?.penaltyDeposit ?? 0)} cash deposit at the counter before the
              vehicle can be checked into the queue.
            </p>
            <div>
              <label className="text-label-md font-semibold text-on-surface-variant mb-1.5 block">
                Amount Received
              </label>
              <input
                type="number"
                value={depositReceivedInput}
                onChange={(e) => {
                  setDepositReceivedInput(e.target.value);
                  setDepositModalError("");
                }}
                placeholder="0"
                className="w-full rounded-xl px-3 py-2.5 text-body-md border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
              />
              {depositModalError && (
                <p className="text-body-md text-error mt-1.5">{depositModalError}</p>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}

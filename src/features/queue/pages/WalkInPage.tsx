//author: Ngọc
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, Check, X } from "lucide-react";
import {
  checkPhone,
  calculateInvoice,
  createWalkIn,
  type CheckPhoneResponse,
  type SavedVehicleDTO,
  type BookingSummaryResponse,
  type AvailableSlotDTO,
} from "../services/walkInApi";
import { formatVND } from "../../../utils/currency";

// hardcode tạm — thay bằng API khi BE có endpoint /api/service-packages
const SERVICE_PACKAGES = [
  { id: 1, name: "Basic Wash", price: 80000 },
  { id: 2, name: "Premium Wash", price: 150000 },
  { id: 3, name: "Full Detail Package", price: 250000 },
];

const STATION_ID = 1; // hardcode tạm — thay bằng AuthContext khi có stationId

type CustomerType = "GUEST" | "MEMBER";
type Step = "select-type" | "vehicle-info" | "service" | "done";

interface VehicleInfo {
  licensePlate: string;
  brandName: string;
  color: string;
  customerId?: number;
  existingVehicleId?: number;
  customerName?: string;
  tierName?: string;
}

export default function WalkInPage() {
  const navigate = useNavigate();
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
  const [summary, setSummary] = useState<BookingSummaryResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotDTO | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // result
  const [ticketNumber, setTicketNumber] = useState("");
  const [remainingBalance, setRemainingBalance] = useState(0);

  const handleSelectType = (type: CustomerType) => {
    setCustomerType(type);
    setStep("vehicle-info");
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
        setPhoneError("Không tìm thấy tài khoản với số điện thoại này.");
      }
    } catch {
      setPhoneError("Lỗi kết nối, thử lại.");
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
  };

  const canProceedToService = () => {
    if (customerType === "GUEST") return vehicleInfo.licensePlate.trim() !== "";
    // MEMBER: need phone result + either saved vehicle or license plate
    return phoneResult?.existed && vehicleInfo.licensePlate.trim() !== "";
  };

  const handleProceedToService = () => {
    setStep("service");
  };

  const handleSelectService = async (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setSelectedSlot(null);
    setSummary(null);
    if (!vehicleInfo.licensePlate.trim()) return;
    setIsCalculating(true);
    try {
      const result = await calculateInvoice({
        customerId: vehicleInfo.customerId,
        licensePlate: vehicleInfo.licensePlate,
        servicePackageId: serviceId,
        stationId: STATION_ID,
      });
      setSummary(result);
    } catch {
      setSummary(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedServiceId || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      const result = await createWalkIn({
        customerId: vehicleInfo.customerId,
        existingVehicleId: vehicleInfo.existingVehicleId,
        licensePlate: vehicleInfo.existingVehicleId ? undefined : vehicleInfo.licensePlate,
        brandName: vehicleInfo.brandName || undefined,
        color: vehicleInfo.color || undefined,
        servicePackageId: selectedServiceId,
        chosenSlotIds: [selectedSlot.slotId],
        stationId: STATION_ID,
        penaltyDepositCollected: false,
      });
      setTicketNumber(result.ticketNumber);
      setRemainingBalance(result.remainingBalance);
      setStep("done");
    } catch {
      alert("Tạo walk-in thất bại, thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {step !== "select-type" && step !== "done" && (
              <button
                onClick={() => setStep(step === "service" ? "vehicle-info" : "select-type")}
                className="rounded-full p-1.5 hover:bg-surface-container transition"
              >
                <ChevronLeft className="w-5 h-5 text-outline" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold font-heading text-on-background">Walk-In Check-In</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {step === "select-type" && "Chọn loại khách"}
                {step === "vehicle-info" && "Thông tin xe & khách"}
                {step === "service" && "Chọn dịch vụ & giờ"}
                {step === "done" && "Đặt lịch thành công"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/staff/queue")}
            aria-label="Đóng, về Queue Page"
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
              className="rounded-2xl p-6 text-left border-2 border-outline-variant hover:border-primary hover:bg-primary-fixed/10 transition bg-surface-container-lowest"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-surface-container">
                <span className="text-lg">👤</span>
              </div>
              <p className="font-bold text-base text-on-surface">GUEST</p>
              <p className="text-xs text-on-surface-variant mt-1">Khách vãng lai, chưa có tài khoản</p>
            </button>
            <button
              onClick={() => handleSelectType("MEMBER")}
              className="rounded-2xl p-6 text-left border-2 border-outline-variant hover:border-primary hover:bg-primary-fixed/10 transition bg-surface-container-lowest"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-primary text-on-primary">
                <span className="text-lg">⭐</span>
              </div>
              <p className="font-bold text-base text-on-surface">MEMBER</p>
              <p className="text-xs text-on-surface-variant mt-1">Khách đã có tài khoản thành viên</p>
            </button>
          </div>
        )}

        {/* Step: Vehicle info */}
        {step === "vehicle-info" && (
          <div className="space-y-5">
            {/* MEMBER: phone lookup */}
            {customerType === "MEMBER" && (
              <div>
                <label className="text-xs font-semibold uppercase text-outline mb-1.5 block">Số điện thoại</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                    placeholder="Nhập số điện thoại..."
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                  />
                  <button
                    onClick={handlePhoneSearch}
                    disabled={isPhoneLoading}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {phoneError && (
                  <p className="text-xs text-error mt-1.5">{phoneError}</p>
                )}
                {phoneResult?.existed && (
                  <div className="rounded-xl p-3 mt-2 bg-surface-container-low border border-outline-variant/30">
                    <p className="font-semibold text-sm text-on-surface">{phoneResult.customerName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary-fixed text-on-primary-fixed">
                      {phoneResult.tierName ?? "MEMBER"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Saved vehicles (MEMBER) */}
            {customerType === "MEMBER" && phoneResult?.savedVehicles && phoneResult.savedVehicles.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase text-outline mb-1.5 block">Chọn xe đã lưu</label>
                <div className="flex flex-col gap-2">
                  {phoneResult.savedVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectSavedVehicle(v)}
                      className={`rounded-xl px-3 py-2.5 text-left border-2 transition ${
                        selectedSavedVehicle?.id === v.id
                          ? "border-primary bg-primary-fixed/10"
                          : "border-outline-variant bg-surface-container-lowest"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-on-surface">{v.licensePlate}</p>
                          <p className="text-xs text-on-surface-variant">{v.brandName} • {v.color}</p>
                        </div>
                        {selectedSavedVehicle?.id === v.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-outline mt-2">— hoặc nhập biển số mới bên dưới —</p>
              </div>
            )}

            {/* License plate */}
            <div>
              <label className="text-xs font-semibold uppercase text-outline mb-1.5 block">
                Biển số xe <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={vehicleInfo.licensePlate}
                onChange={(e) => {
                  setVehicleInfo((prev) => ({ ...prev, licensePlate: e.target.value, existingVehicleId: undefined }));
                  setSelectedSavedVehicle(null);
                }}
                placeholder="VD: 51A-12345"
                className="w-full rounded-xl px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
              />
            </div>

            {/* Brand + Color (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-outline mb-1.5 block">Hãng xe</label>
                <input
                  type="text"
                  value={vehicleInfo.brandName}
                  onChange={(e) => setVehicleInfo((prev) => ({ ...prev, brandName: e.target.value }))}
                  placeholder="VD: Toyota"
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-outline mb-1.5 block">Màu xe</label>
                <input
                  type="text"
                  value={vehicleInfo.color}
                  onChange={(e) => setVehicleInfo((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="VD: Đỏ"
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-outline-variant outline-none focus:border-primary bg-surface-container-lowest text-on-surface"
                />
              </div>
            </div>

            {/* GUEST badge */}
            {customerType === "GUEST" && (
              <div className="rounded-xl px-4 py-3 bg-surface-container border border-outline-variant/30">
                <p className="text-xs text-on-surface-variant">Khách sẽ được đặt lịch với tier <span className="font-semibold text-on-surface">GUEST</span> — không áp dụng voucher hay discount.</p>
              </div>
            )}

            <button
              onClick={handleProceedToService}
              disabled={!canProceedToService()}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Tiếp theo
            </button>
          </div>
        )}

        {/* Step: Service */}
        {step === "service" && (
          <div className="space-y-5">
            {/* Customer summary */}
            <div className="rounded-xl px-4 py-3 bg-surface-container-low border border-outline-variant/30">
              <p className="font-bold text-sm text-on-surface">{vehicleInfo.licensePlate}</p>
              {vehicleInfo.customerName && (
                <p className="text-xs text-on-surface-variant mt-0.5">{vehicleInfo.customerName} • {vehicleInfo.tierName}</p>
              )}
              {!vehicleInfo.customerName && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-surface-container text-on-surface-variant">GUEST</span>
              )}
            </div>

            {/* Service packages */}
            <div>
              <label className="text-xs font-semibold uppercase text-outline mb-2 block">Gói dịch vụ</label>
              <div className="flex flex-col gap-2">
                {SERVICE_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectService(pkg.id)}
                    className={`rounded-xl px-4 py-3 text-left border-2 transition ${
                      selectedServiceId === pkg.id
                        ? "border-primary bg-primary-fixed/10"
                        : "border-outline-variant bg-surface-container-lowest"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-on-surface">{pkg.name}</p>
                      <p className="text-sm font-bold text-primary">{formatVND(pkg.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Invoice summary */}
            {isCalculating && (
              <div className="rounded-xl p-4 text-center bg-surface-container-low">
                <p className="text-sm text-outline">Đang tính hoá đơn...</p>
              </div>
            )}

            {summary && !isCalculating && (
              <div className="rounded-xl p-4 bg-surface-container-low border border-outline-variant/30 space-y-2">
                <p className="text-xs font-semibold uppercase text-outline mb-2">Hoá đơn preview</p>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Giá gốc</span>
                  <span className="text-on-surface">{formatVND(summary.rawAmount)}</span>
                </div>
                {summary.packageDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Giảm giá gói</span>
                    <span className="text-green-600">- {formatVND(summary.packageDiscount)}</span>
                  </div>
                )}
                {summary.penaltyDeposit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-error">Cọc phạt</span>
                    <span className="text-error">{formatVND(summary.penaltyDeposit)}</span>
                  </div>
                )}
                {summary.transferredCredit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Credit chuyển</span>
                    <span className="text-green-600">- {formatVND(summary.transferredCredit)}</span>
                  </div>
                )}
                <div className="border-t border-outline-variant pt-2 flex justify-between text-sm font-bold">
                  <span className="text-on-surface">Cần thanh toán</span>
                  <span className="text-primary">{formatVND(summary.remainingBalance)}</span>
                </div>
                {summary.systemNotice && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{summary.systemNotice}</p>
                )}
                {summary.isActionBlock && (
                  <div className="rounded-xl px-3 py-2 bg-error-container border border-error">
                    <p className="text-xs font-semibold text-on-error-container">Cần thu cọc phạt 20,000đ trước khi xác nhận</p>
                  </div>
                )}

                {/* Available slots */}
                {summary.availableSlots.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold uppercase text-outline mb-2">Chọn giờ</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.availableSlots.map((slot) => (
                        <button
                          key={slot.slotId}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            selectedSlot?.slotId === slot.slotId
                              ? "bg-primary text-on-primary border-primary"
                              : "bg-surface-container-lowest text-on-surface border-outline-variant hover:border-primary"
                          }`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!selectedServiceId || !selectedSlot || isSubmitting || (summary?.isActionBlock ?? false)}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận Walk-In"}
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary">
              <Check className="w-8 h-8 text-on-primary" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-1">Đặt lịch thành công!</h2>
            <p className="text-sm text-on-surface-variant mb-6">Xe đang chờ staff check-in tại quầy</p>
            <div className="rounded-2xl p-6 bg-surface-container-low border border-outline-variant/30 mb-6">
              <p className="text-xs font-semibold uppercase text-outline mb-1">Số vé</p>
              <p className="text-4xl font-bold text-primary tracking-widest">{ticketNumber}</p>
              <div className="border-t border-outline-variant mt-4 pt-4">
                <p className="text-xs text-on-surface-variant">Còn cần thanh toán</p>
                <p className="text-xl font-bold text-on-surface">{formatVND(remainingBalance)}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/staff/queue")}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary"
            >
              Về Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

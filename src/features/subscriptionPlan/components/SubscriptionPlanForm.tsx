import { useEffect, useState, type ReactNode } from "react";
import { CarFront, ChevronDown, Info, Save, Tag } from "lucide-react";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getSubscriptionTypeLabel } from "../../../constants/subscriptionStyles";
import {
  create,
  getServicePackageOptions,
  update,
} from "../api/subscriptionPlanApi";
import {
  SUBSCRIPTION_PLAN_ERROR_CODES,
  type PlanStatus,
  type PlanType,
  type ServicePackageOption,
} from "../types/subscriptionPlan";

const STATUSES: PlanStatus[] = ["ACTIVE", "INACTIVE"];

// Style dùng chung cho input/select/label, theo đúng token trong index.css (@theme) +
// pattern đã có sẵn ở VehicleForm.tsx (text-body-md, rounded-lg, border-outline-variant)
const inputClass = (hasError: boolean, hasSuffix = false) =>
  `w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
    hasSuffix ? "pr-14" : ""
  } ${hasError ? "border-error" : "border-outline-variant focus:border-primary"}`;
// Đồng bộ với VehicleForm: uppercase + tracking-wide cho label, text-label-md cho error
const labelClass =
  "mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant";
const errorTextClass = "mt-1.5 text-label-md text-error";

// <select> native có mũi tên do trình duyệt tự vẽ, canh lệch/không đều giữa các trình duyệt
// khi kết hợp với padding/border-radius tuỳ chỉnh -> tắt appearance mặc định, tự vẽ 1 icon
// ChevronDown canh giữa tuyệt đối theo chiều dọc để luôn thẳng hàng, đồng bộ mọi nơi.
function SelectField({
  label,
  error,
  children,
  ...selectProps
}: {
  label: string;
  error?: string | null;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <select
          {...selectProps}
          className={`${inputClass(!!error)} appearance-none pr-10`}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={2.25}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
    </div>
  );
}

// 1 khối field có đơn vị ("VND", "days"...) hiện bên phải input, gọn hơn nhồi chữ vào label
function FieldWithSuffix({
  label,
  suffix,
  error,
  children,
}: {
  label: string;
  suffix: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        {children}
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-label-sm text-on-surface-variant">
          {suffix}
        </span>
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
    </div>
  );
}

// Khối 1 nhóm field, có icon + tiêu đề, dùng cho cả 2 cột (Basic Information / Pricing & Rules)
function FormSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
      <div className="mb-5 flex items-center gap-2 border-b border-outline-variant pb-4">
        <span className="text-primary">{icon}</span>
        <h2 className="font-heading text-body-lg font-bold text-on-surface">
          {title}
        </h2>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

interface SubscriptionPlanFormProps {
  onSuccess: (message?: string) => void;
  onCancel: () => void;
  // Có planId + initialData -> chế độ Edit, không có -> chế độ Create
  planId?: number;
  initialData?: {
    planName: string;
    price: number;
    durationDays: number;
    description: string;
    servicePackageId: number;
    planType: PlanType;
    maxVehicleCount: number | null;
    status: PlanStatus;
  };
  // Chỉ dùng ở chế độ Create, khi đi vào từ màn "chọn loại" (SubscriptionPlanTypeSelect) -
  // planType đã được quyết định trước theo đường link (Unlimited/Family), nên ẩn hẳn dropdown
  // Plan Type, khoá cứng giá trị này, không cho đổi qua lại giữa 2 loại nữa.
  fixedPlanType?: PlanType;
}

export default function SubscriptionPlanForm({
  onSuccess,
  onCancel,
  planId,
  initialData,
  fixedPlanType,
}: SubscriptionPlanFormProps) {
  const isEditMode = !!planId;

  const [planName, setPlanName] = useState(initialData?.planName ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [durationDays, setDurationDays] = useState(
    initialData?.durationDays?.toString() ?? "",
  );
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [servicePackageId, setServicePackageId] = useState(
    initialData?.servicePackageId?.toString() ?? "",
  );
  // planType không cho sửa ở cả Create (khoá theo fixedPlanType từ màn chọn loại) lẫn Edit
  // (khoá theo initialData) - không có setter vì không còn UI nào đổi giá trị này.
  const [planType] = useState<PlanType>(
    initialData?.planType ?? fixedPlanType ?? "UNLIMIT",
  );
  // maxVehicleCount không còn state riêng - FAMILY cố định = 5, UNLIMIT cố định = 1,
  // FE tự gán khi submit (xem payload bên dưới), không cho admin nhập tự do.
  const [status, setStatus] = useState<PlanStatus>(
    initialData?.status ?? "ACTIVE",
  );

  const [servicePackages, setServicePackages] = useState<
    ServicePackageOption[]
  >([]);

  // Lỗi riêng từng field
  const [planNameError, setPlanNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [durationDaysError, setDurationDaysError] = useState<string | null>(
    null,
  );
  const [servicePackageError, setServicePackageError] = useState<string | null>(
    null,
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Spec Edit: disable Save nếu chưa có thay đổi so với initialData ban đầu.
  // Create mode luôn "dirty" (không có initialData để so sánh).
  const isDirty =
    !isEditMode ||
    planName !== (initialData?.planName ?? "") ||
    price !== (initialData?.price?.toString() ?? "") ||
    durationDays !== (initialData?.durationDays?.toString() ?? "") ||
    description !== (initialData?.description ?? "") ||
    servicePackageId !== (initialData?.servicePackageId?.toString() ?? "") ||
    status !== (initialData?.status ?? "ACTIVE");

  // AC02 US-02: dropdown service package chỉ hiển thị các gói đang ACTIVE.
  // Hiện lấy từ mock trong subscriptionPlanApi.ts (xem comment đầu file đó để bật lại API thật).
  useEffect(() => {
    getServicePackageOptions().then(setServicePackages);
  }, []);

  const validate = (): boolean => {
    let isValid = true;
    setPlanNameError(null);
    setPriceError(null);
    setDurationDaysError(null);
    setServicePackageError(null);

    if (!planName.trim()) {
      setPlanNameError("Plan name is required.");
      isValid = false;
    }
    if (!servicePackageId) {
      setServicePackageError("Service package is required.");
      isValid = false;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setPriceError("Price must be greater than 0.");
      isValid = false;
    }
    // durationDays là dropdown [30/90/180] - chỉ cần check đã chọn chưa
    if (!durationDays) {
      setDurationDaysError("Please select a duration.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        planName: planName.trim(),
        price: Number(price),
        durationDays: Number(durationDays),
        description: description.trim(),
        servicePackageId: Number(servicePackageId),
        planType,
        // FAMILY cố định = 5, UNLIMIT cố định = 1 - không phụ thuộc input của admin
        maxVehicleCount: planType === "FAMILY" ? 5 : 1,
      };

      const result = isEditMode
        ? await update(planId!, { ...payload, status })
        : await create(payload);

      onSuccess(result.message);
    } catch (error) {
      const { errorCode, message } = getApiErrorInfo(error);
      const codes = SUBSCRIPTION_PLAN_ERROR_CODES;

      switch (errorCode) {
        case codes.PLAN_NAME_REQUIRED:
          setPlanNameError(message ?? "Plan name is required.");
          break;
        case codes.SERVICE_PACKAGE_REQUIRED:
        case codes.INVALID_SERVICE_PACKAGE:
          setServicePackageError(message ?? "Invalid service package.");
          break;
        case codes.INVALID_PRICE:
          setPriceError(message ?? "Price must be greater than 0.");
          break;
        case codes.INVALID_DURATION_DAYS:
          setDurationDaysError(message ?? "Duration must be greater than 0.");
          break;

        default:
          setFormError(
            message ??
              `Unable to ${isEditMode ? "update" : "create"} plan. Please try again.`,
          );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {formError && (
        <div className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Basic Information */}
        <div className="lg:col-span-3">
          <FormSection icon={<Info size={18} />} title="Basic Information">
            <div>
              <label className={labelClass}>Plan Name</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Unlimited Premium"
                className={inputClass(!!planNameError)}
              />
              {planNameError && (
                <p className={errorTextClass}>{planNameError}</p>
              )}
            </div>

            <SelectField
              label="Service Package"
              value={servicePackageId}
              onChange={(e) => setServicePackageId(e.target.value)}
              error={servicePackageError}
            >
              <option value="">Select a service package</option>
              {servicePackages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectField>

            {/* planType không cho sửa: Create khoá theo loại đã chọn ở màn trước
                (SubscriptionPlanTypeSelect), Edit hiển thị read-only - không cho đổi qua lại
                loại nữa (BE không hỗ trợ update planType). */}
            {isEditMode && (
              <div>
                <label className={labelClass}>Plan Type</label>
                <div
                  className={`${inputClass(false)} flex items-center bg-surface-container-high text-on-surface-variant`}
                >
                  {getSubscriptionTypeLabel(planType)}
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key benefits of this plan..."
                rows={3}
                className={inputClass(false)}
              />
            </div>
          </FormSection>
        </div>

        {/* Pricing & Rules */}
        <div className="space-y-6 lg:col-span-2">
          <FormSection icon={<Tag size={18} />} title="Pricing">
            <FieldWithSuffix label="Price" suffix="VNĐ" error={priceError}>
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1,999,000"
                className={inputClass(!!priceError, true)}
              />
            </FieldWithSuffix>

            {/* Chỉ cho chọn 3 kỳ hạn cố định theo spec - không free input */}
            <SelectField
              label="Duration"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              error={durationDaysError}
            >
              <option value="">Select duration</option>
              <option value="30">1 Month (30 days)</option>
              <option value="90">3 Months (90 days)</option>
              <option value="180">6 Months (180 days)</option>
            </SelectField>
          </FormSection>

          {/* FAMILY: hiện maxVehicleCount readonly = 5. UNLIMIT: ẩn hoàn toàn (luôn gửi 1).
              Status chỉ cho sửa ở Edit mode. */}
          {(planType === "FAMILY" || isEditMode) && (
            <FormSection icon={<CarFront size={18} />} title="Membership Rules">
              {planType === "FAMILY" && (
                <div>
                  <label className={labelClass}>Max Vehicles</label>
                  {/* Readonly = 5, cố định theo spec - FE tự gán, không cho nhập tự do */}
                  <div
                    className={`${inputClass(false)} flex items-center justify-between bg-surface-container-high text-on-surface-variant`}
                  >
                    <span>5</span>
                    <span className="text-label-sm">cars</span>
                  </div>
                  <p className="mt-1.5 text-label-sm text-on-surface-variant">
                    Fixed at 5 vehicles for all Family plans.
                  </p>
                </div>
              )}

              {/* AC02 US-03: status chỉ cho sửa ở màn Edit */}
              {isEditMode && (
                <SelectField
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlanStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </SelectField>
              )}
            </FormSection>
          )}
        </div>
      </div>

      {/* service_cate_id: KHÔNG hiển thị, KHÔNG cho sửa - BE tự gán (AC04 US-02 / AC04 US-03) */}

      <div className="mt-6 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-body-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (isEditMode && !isDirty)}
          className={`flex items-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors ${
            isSubmitting || (isEditMode && !isDirty)
              ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
              : "bg-primary text-on-primary hover:opacity-90"
          }`}
        >
          <Save size={16} />
          {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create"}
        </button>
      </div>
    </form>
  );
}

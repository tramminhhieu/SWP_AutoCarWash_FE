import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Mail, Phone, User, X } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { createAdminEmployee } from "../api/adminEmployeeApi";
import { formatDateOnly } from "../../booking/utils/bookingFormatters";
import type { AdminStationOption } from "../../adminCustomer/api/adminCustomerBookingApi";
const PHONE_PATTERN = /^0\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// BE trả errorCode chung cho cả app; dịch sang câu nói rõ ngữ cảnh nhân viên.
const SAVE_ERROR_MAP: Record<string, string> = {
  AUTH_001: "This email is already used by another account.",
  AUTH_002: "This phone number is already used by another account.",
  STATION_001: "The selected branch no longer exists.",
};

// ─── UI riêng của form Create ────────────────────────────────────────────────
// Bám theo ngôn ngữ của trang Customer Profile (features/customer/pages/Profile.tsx):
// label chữ thường, input px-4 py-3, card bo 2xl. Cố tình tự chứa, KHÔNG dùng chung
// với form Edit trong AdminEmployees.tsx - form Edit phải giữ nguyên style đã commit.

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-white px-4 py-3 text-sm text-on-surface outline-none transition-colors ${
    error ? "border-error" : "border-outline-variant focus:border-primary"
  }`;
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-on-surface-variant">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

/**
 * Ô nhập mật khẩu có nút con mắt để xem/ẩn mật khẩu đang gõ - admin tự đặt mật
 * khẩu cho nhân viên nên cần đọc lại được để báo cho họ.
 */
function PasswordInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass(error)} pr-11`}
      />
      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <Icon className="size-4" />
      </button>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface CreateForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stationId: string;
  active: string;
  password: string;
  confirmPassword: string;
}

const MIN_PASSWORD_LENGTH = 6;

export default function EmployeeCreateModal({
  stations,
  onClose,
  onCreated,
}: {
  stations: AdminStationOption[];
  onClose: () => void;
  onCreated: (fullName: string) => void;
}) {
  const [form, setForm] = useState<CreateForm>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Chọn sẵn chi nhánh đầu tiên để select không rơi vào trạng thái rỗng.
    stationId: stations[0] ? String(stations[0].id) : "",
    active: "true",
    password: "",
    confirmPassword: "",
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(key: keyof CreateForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Xoá lỗi của đúng field đang gõ để thông báo không dính lại sau khi đã sửa.
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateForm(current: CreateForm): boolean {
    const errors: Record<string, string> = {};
    if (!current.firstName.trim()) errors.firstName = "First name is required.";
    if (!current.lastName.trim()) errors.lastName = "Last name is required.";
    if (!EMAIL_PATTERN.test(current.email.trim()))
      errors.email = "Enter a valid email address.";
    if (!PHONE_PATTERN.test(current.phone.trim()))
      errors.phone = "Phone must be 10 digits and start with 0.";
    if (!current.stationId) errors.stationId = "Branch is required.";
    if (current.password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (current.confirmPassword !== current.password)
      errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    setSaveError(null);
    if (!validateForm(form)) return;

    setIsSubmitting(true);
    // confirmPassword chỉ để đối chiếu ở FE, BE không nhận field này.
    createAdminEmployee({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      stationId: Number(form.stationId),
      active: form.active === "true",
      password: form.password,
    })
      .then((created) => {
        onCreated(created.fullName);
      })
      .catch((err) => {
        const { errorCode, message } = getApiErrorInfo(err);
        setSaveError(
          SAVE_ERROR_MAP[errorCode ?? ""] ??
            message ??
            "Could not create this staff account. Please try again.",
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  // Preview cập nhật theo lúc gõ. Nhân viên chưa tồn tại nên chưa có ID,
  // và ngày tạo chính là hôm nay.
  const previewName = [form.firstName.trim(), form.lastName.trim()]
    .filter(Boolean)
    .join(" ");
  const todayLabel = formatDateOnly(new Date().toISOString());

  return (
    <Modal isOpen onClose={onClose} variant="custom" size="lg">
      <div className="flex w-full flex-col gap-6 text-left text-sm">
        <div className="border-b border-outline-variant/30 pb-4">
          <h2 className="font-heading text-xl font-bold text-on-surface">
            Add New Staff
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Create an account and assign it to a branch.
          </p>
        </div>

        {saveError && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {saveError}
          </div>
        )}

        <div className="flex items-start gap-6">
          {/* Card preview - avatar icon người + tên + ngày tạo, giống sidebar của Profile. */}
          <div className="flex w-[240px] shrink-0 flex-col items-center gap-3 rounded-2xl border border-outline-variant/30 bg-[#F8FAFC] p-6">
            <div className="flex size-24 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
              <User className="size-14 text-primary/40" />
            </div>
            <h3 className="text-center font-heading text-xl font-bold text-on-surface">
              {previewName || "New Staff"}
            </h3>
            <p className="text-xs text-on-surface-variant">
              Created {todayLabel}
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-5">
            <FormField label="First Name" error={fieldErrors.firstName}>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className={inputClass(fieldErrors.firstName)}
              />
            </FormField>
            <FormField label="Last Name" error={fieldErrors.lastName}>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className={inputClass(fieldErrors.lastName)}
              />
            </FormField>

            <FormField label="Email" error={fieldErrors.email}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={`${inputClass(fieldErrors.email)} pl-10`}
                />
              </div>
            </FormField>
            <FormField label="Phone Number" error={fieldErrors.phone}>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={`${inputClass(fieldErrors.phone)} pl-10`}
                />
              </div>
            </FormField>

            <FormField label="Branch" error={fieldErrors.stationId}>
              <div className="relative">
                <select
                  value={form.stationId}
                  onChange={(e) => updateField("stationId", e.target.value)}
                  className={`${inputClass(fieldErrors.stationId)} appearance-none pr-10`}
                >
                  {stations.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.stationName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
              </div>
            </FormField>
            <FormField label="Account Status">
              <div className="relative">
                <select
                  value={form.active}
                  onChange={(e) => updateField("active", e.target.value)}
                  className={`${inputClass()} appearance-none pr-10`}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
              </div>
            </FormField>

            <FormField label="Password" error={fieldErrors.password}>
              <PasswordInput
                value={form.password}
                onChange={(v) => updateField("password", v)}
                error={fieldErrors.password}
              />
            </FormField>
            <FormField
              label="Confirm Password"
              error={fieldErrors.confirmPassword}
            >
              <PasswordInput
                value={form.confirmPassword}
                onChange={(v) => updateField("confirmPassword", v)}
                error={fieldErrors.confirmPassword}
              />
            </FormField>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-ice disabled:opacity-50"
          >
            <X className="size-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
          >
            {isSubmitting && (
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isSubmitting ? "Creating..." : "Create Staff"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

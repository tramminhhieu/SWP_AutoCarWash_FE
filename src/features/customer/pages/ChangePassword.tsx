import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { isAxiosError } from "axios";

// ─── Mock API — xoá và thay bằng import thật khi BE sẵn sàng ─────────────────
// Thêm vào features/auth/api/authApi.ts:
//
// export interface ChangePasswordRequest {
//   currentPassword: string;
//   newPassword: string;
//   confirmNewPassword: string;
// }
//
// export const changePassword = async (data: ChangePasswordRequest) => {
//   const res = await axiosClient.post("/api/auth/change-password", data);
//   return res.data;
// };

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Mock luôn thành công — thay bằng import từ authApi khi có BE
const changePassword = async (_data: ChangePasswordRequest): Promise<void> => {
  void _data;
  await new Promise((resolve) => setTimeout(resolve, 800));
};

// ─────────────────────────────────────────────────────────────────────────────

type FieldKey = "currentPassword" | "newPassword" | "confirmNewPassword";

export default function ChangePassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState<ChangePasswordRequest>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Toggle hiện/ẩn từng field password riêng biệt
  const [showPw, setShowPw] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (field: FieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Xoá lỗi field ngay khi user bắt đầu gõ lại
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleShow = (field: FieldKey) => {
    setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Validate FE trước khi gọi API (AC-04.4: confirm khớp new)
  const validate = (): boolean => {
    const errs: typeof fieldErrors = {};
    if (!form.currentPassword) errs.currentPassword = "This field is required";
    if (!form.newPassword) {
      errs.newPassword = "This field is required";
    } else if (form.newPassword.length > 20) {
      // FE chặn max 20 ký tự (nhóm đã thống nhất, BE không validate rule này)
      errs.newPassword = "Password must not exceed 20 characters";
    }
    if (!form.confirmNewPassword) {
      errs.confirmNewPassword = "This field is required";
    } else if (
      form.newPassword &&
      form.confirmNewPassword !== form.newPassword
    ) {
      // AC-04.4: FE check luôn để tiết kiệm round-trip, BE vẫn check lại
      errs.confirmNewPassword = "Confirm password does not match";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Map lỗi field-level từ BE (errors[] trong COMMON_003) vào đúng state
  const applyServerErrors = (
    errors: { field: string; errorCode: string; message: string }[],
  ) => {
    const errs: typeof fieldErrors = {};
    errors.forEach((err) => {
      if (
        err.field === "currentPassword" ||
        err.field === "newPassword" ||
        err.field === "confirmNewPassword"
      ) {
        // Dùng message từ BE vì errorCode còn tbd — khi BE confirm enum thì cập nhật lại
        errs[err.field as FieldKey] = err.message;
      }
    });
    setFieldErrors(errs);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await changePassword(form);
      // AC-04.1: thành công → về Profile, hiện message thành công qua location state
      navigate("/customer/profile", {
        state: {
          passwordChangedSuccess:
            "Your password has been updated successfully.",
        },
      });
    } catch (err) {
      if (isAxiosError(err)) {
        const errors = err.response?.data?.errors as
          | { field: string; errorCode: string; message: string }[]
          | undefined;
        if (errors?.length) {
          applyServerErrors(errors);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="mx-auto max-w-[520px] px-6">
        {/* Card form đổi mật khẩu */}
        <div className="rounded-2xl border border-outline-variant/30 bg-white p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
          {/* Tiêu đề */}
          <div className="mb-6 flex items-center gap-3 border-b border-outline-variant/20 pb-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="size-5 text-primary" />
            </div>
            <h1 className="font-heading text-lg font-bold text-on-surface">
              Change Password
            </h1>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-5">
            {/* Current Password */}
            <PasswordField
              label="Current Password"
              value={form.currentPassword}
              show={showPw.currentPassword}
              error={fieldErrors.currentPassword}
              maxLength={20}
              onChange={(v) => handleChange("currentPassword", v)}
              onToggleShow={() => toggleShow("currentPassword")}
              placeholder="Enter your current password"
            />

            {/* New Password */}
            <PasswordField
              label="New Password"
              value={form.newPassword}
              show={showPw.newPassword}
              error={fieldErrors.newPassword}
              maxLength={20}
              onChange={(v) => handleChange("newPassword", v)}
              onToggleShow={() => toggleShow("newPassword")}
              placeholder="Enter new password"
            />

            {/* Confirm New Password */}
            <PasswordField
              label="Confirm New Password"
              value={form.confirmNewPassword}
              show={showPw.confirmNewPassword}
              error={fieldErrors.confirmNewPassword}
              onChange={(v) => handleChange("confirmNewPassword", v)}
              onToggleShow={() => toggleShow("confirmNewPassword")}
              placeholder="Re-enter new password"
            />
          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => navigate("/customer/profile")}
              disabled={isSubmitting}
              className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-ice disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {isSubmitting && (
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              Update Password
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-component: 1 field password có show/hide toggle ─────────────────────
function PasswordField({
  label,
  value,
  show,
  error,
  maxLength,
  hint,
  placeholder,
  onChange,
  onToggleShow,
}: {
  label: string;
  value: string;
  show: boolean;
  error?: string;
  maxLength?: number;
  hint?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onToggleShow: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm text-on-surface outline-none transition-colors
            focus:border-primary
            ${error ? "border-error bg-error/5" : "border-outline-variant bg-white"}
          `}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {/* Hiện hint (vd: bộ đếm ký tự) hoặc lỗi — không hiện cùng lúc */}
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

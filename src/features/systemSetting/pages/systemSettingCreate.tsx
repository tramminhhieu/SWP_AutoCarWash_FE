import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Save, Settings } from "lucide-react";
import { createSetting } from "../api/systemSettingApi";
import type { CreateSettingRequest, DataType } from "../types/systemSetting";
import { getApiErrorInfo } from "../../../lib/axiosClient";

// Thời gian hiện thông báo thành công trước khi tự chuyển về danh sách (ms)
const REDIRECT_DELAY_MS = 1800;

// Các category đang có trong hệ thống — dùng cho dropdown
const KNOWN_CATEGORIES = [
  "Payment & Deposit",
  "Booking Rules",
  "Loyalty Program",
  "System",
];

// setting_key phải là UPPER_SNAKE_CASE: chỉ in hoa, số, và dấu gạch dưới
const SETTING_KEY_REGEX = /^[A-Z][A-Z0-9_]*$/;

// ─── SettingCreateForm ─────────────────────────────────────────────────────────
function SettingCreateForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (message?: string) => void;
  onCancel: () => void;
}) {
  const [settingKey, setSettingKey] = useState("");
  const [dataType, setDataType] = useState<DataType>("NUMBER");
  const [settingValue, setSettingValue] = useState("");
  const [category, setCategory] = useState(KNOWN_CATEGORIES[0]);
  const [description, setDescription] = useState("");

  // Lỗi riêng từng field
  const [keyError, setKeyError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khi đổi data_type → reset value để tránh giá trị cũ không hợp lệ với type mới
  function handleDataTypeChange(newType: DataType) {
    setDataType(newType);
    setSettingValue(newType === "BOOLEAN" ? "false" : "");
    setValueError(null);
  }

  // Auto-transform setting_key: in hoa, space → underscore, ký tự đặc biệt bị loại
  function handleKeyChange(raw: string) {
    const transformed = raw
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");
    setSettingKey(transformed);
    setKeyError(null);
  }

  function validate(): boolean {
    let valid = true;
    setKeyError(null);
    setValueError(null);

    if (!settingKey.trim()) {
      setKeyError("Setting key is required.");
      valid = false;
    } else if (!SETTING_KEY_REGEX.test(settingKey)) {
      setKeyError(
        "Key must be UPPER_SNAKE_CASE (letters, digits, underscores only, starting with a letter).",
      );
      valid = false;
    }

    if (dataType !== "BOOLEAN") {
      if (!settingValue.trim()) {
        setValueError("Value is required.");
        valid = false;
      } else if (dataType === "NUMBER" && isNaN(Number(settingValue))) {
        setValueError("Value must be a valid number.");
        valid = false;
      }
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateSettingRequest = {
        setting_key: settingKey,
        setting_value:
          dataType === "BOOLEAN"
            ? settingValue || "false"
            : settingValue.trim(),
        category,
        data_type: dataType,
        description: description.trim(),
      };
      const { message } = await createSetting(payload);
      onSuccess(message);
    } catch (error) {
      const { errorCode, message } = getApiErrorInfo(error);
      // setting_key đã tồn tại → highlight đúng field key
      if (errorCode === "DUPLICATE_SETTING_KEY") {
        setKeyError(
          message ?? "This setting key already exists in the system.",
        );
      } else {
        setFormError(message ?? "Unable to create setting. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 pb-6">
        <Settings size={20} className="text-primary" />
        <h2 className="text-headline-md text-on-surface">
          Setting Configuration
        </h2>
      </div>

      {/* Lỗi chung của form */}
      {formError && (
        <div className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {formError}
        </div>
      )}

      {/* SETTING KEY */}
      <div className="mb-5">
        <label
          htmlFor="settingKey"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          Setting Key
        </label>
        <input
          id="settingKey"
          type="text"
          value={settingKey}
          onChange={(e) => handleKeyChange(e.target.value)}
          placeholder="DEPOSIT_PERCENT"
          className={`w-full rounded-lg border px-4 py-2.5 font-mono text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
            keyError
              ? "border-error"
              : "border-outline-variant focus:border-primary"
          }`}
        />
        {keyError ? (
          <p className="mt-1.5 text-label-md text-error">{keyError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-on-surface-variant/70">
            Auto-formatted to UPPER_SNAKE_CASE. Must be unique.
          </p>
        )}
      </div>

      {/* DATA TYPE + CATEGORY — 2 cột */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="dataType"
            className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
          >
            Data Type
          </label>
          <select
            id="dataType"
            value={dataType}
            onChange={(e) => handleDataTypeChange(e.target.value as DataType)}
            className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
          >
            <option value="NUMBER">NUMBER</option>
            <option value="STRING">STRING</option>
            <option value="BOOLEAN">BOOLEAN</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
          >
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
          >
            {KNOWN_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VALUE — render khác nhau theo data_type */}
      <div className="mb-5">
        <label
          htmlFor="settingValue"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          Value
        </label>

        {dataType === "BOOLEAN" ? (
          // Toggle cho BOOLEAN
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setSettingValue((v) => (v === "true" ? "false" : "true"))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                settingValue === "true" ? "bg-primary" : "bg-outline-variant"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settingValue === "true" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-semibold text-on-surface">
              {settingValue === "true" ? "Enabled (true)" : "Disabled (false)"}
            </span>
          </div>
        ) : (
          <input
            id="settingValue"
            type={dataType === "NUMBER" ? "number" : "text"}
            value={settingValue}
            onChange={(e) => {
              setSettingValue(e.target.value);
              setValueError(null);
            }}
            placeholder={dataType === "NUMBER" ? "e.g. 30" : "e.g. 1900-1234"}
            className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
              valueError
                ? "border-error"
                : "border-outline-variant focus:border-primary"
            }`}
          />
        )}
        {valueError && (
          <p className="mt-1.5 text-label-md text-error">{valueError}</p>
        )}
      </div>

      {/* DESCRIPTION */}
      <div className="mb-5">
        <label
          htmlFor="description"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          Description{" "}
          <span className="normal-case tracking-normal text-outline">
            (optional)
          </span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what this setting controls..."
          rows={3}
          className="w-full resize-none rounded-lg border border-outline-variant px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary"
        />
      </div>

      <div className="my-7 border-t border-outline-variant" />

      <div className="flex items-center justify-end gap-4">
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
          disabled={isSubmitting}
          className={`flex items-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors ${
            isSubmitting
              ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
              : "bg-primary text-on-primary hover:opacity-90"
          }`}
        >
          <Save size={16} />
          {isSubmitting ? "Saving..." : "Save Setting"}
        </button>
      </div>
    </form>
  );
}

// ─── SystemSettingCreate ───────────────────────────────────────────────────────
export default function SystemSettingCreate() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  // Tạo thành công → hiện thông báo rồi tự redirect về danh sách
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      navigate("/admin/system-settings");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSuccess, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-margin-mobile py-12 md:px-margin-desktop">
        <h1 className="font-headline text-headline-xl text-on-surface">
          Add New Setting
        </h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">
          Declare a new system rule without requiring a SQL script.
        </p>

        <div className="mt-8">
          {isSuccess ? (
            // Màn hình success — nhất quán với VehicleAdd
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed/30 text-tertiary-fixed-dim">
                <CheckCircle2 size={28} strokeWidth={2} />
              </span>
              <p className="text-headline-md text-on-surface">
                {successMessage ?? "Setting created!"}
              </p>
              <p className="text-body-md text-on-surface-variant">
                Redirecting to settings list...
              </p>
            </div>
          ) : (
            <SettingCreateForm
              onSuccess={(message) => {
                setSuccessMessage(message);
                setIsSuccess(true);
              }}
              onCancel={() => navigate("/admin/system-settings")}
            />
          )}
        </div>
      </div>
    </main>
  );
}

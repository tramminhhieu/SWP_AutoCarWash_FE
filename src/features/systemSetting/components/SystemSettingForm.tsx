import { useState } from "react";
import { Save, Settings } from "lucide-react";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { createSystemSetting } from "../api/systemSettingApi";
import type {
  CreateSystemSettingRequest,
  SettingDataType,
  SystemSettingWithCategoryDto,
} from "../types/systemSetting";

const DATA_TYPES: SettingDataType[] = ["NUMBER", "BOOLEAN", "STRING"];

interface SystemSettingFormProps {
  /** Category đã có sẵn (từ các tab hiện tại) để gợi ý, không bắt buộc chọn đúng 1 trong số này. */
  existingCategories: string[];
  onCreated: (setting: SystemSettingWithCategoryDto) => void;
  onCancel: () => void;
}

export default function SystemSettingForm({
  existingCategories,
  onCreated,
  onCancel,
}: SystemSettingFormProps) {
  const [settingKey, setSettingKey] = useState("");
  const [category, setCategory] = useState(existingCategories[0] ?? "");
  const [dataType, setDataType] = useState<SettingDataType>("STRING");
  const [settingValue, setSettingValue] = useState("");
  const [description, setDescription] = useState("");

  const [keyError, setKeyError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setKeyError(null);
    setValueError(null);

    const trimmedKey = settingKey.trim();
    if (!trimmedKey) {
      setKeyError("Setting key is required");
      isValid = false;
    } else if (/\s/.test(trimmedKey)) {
      setKeyError("Setting key cannot contain spaces (use SNAKE_CASE)");
      isValid = false;
    }

    if (!settingValue.trim()) {
      setValueError("Setting value is required");
      isValid = false;
    } else if (dataType === "NUMBER" && isNaN(Number(settingValue))) {
      setValueError("Value must be a number");
      isValid = false;
    } else if (
      dataType === "BOOLEAN" &&
      settingValue !== "true" &&
      settingValue !== "false"
    ) {
      setValueError('Value must be "true" or "false"');
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
      const payload: CreateSystemSettingRequest = {
        setting_key: settingKey.trim(),
        setting_value: settingValue.trim(),
        category: category.trim() || "Uncategorized",
        data_type: dataType,
        description: description.trim(),
      };
      const created = await createSystemSetting(payload);
      onCreated(created);
    } catch (err) {
      // Tài liệu không cho errorCode cụ thể cho case trùng setting_key -> hiện message thô.
      const { message } = getApiErrorInfo(err);
      setFormError(message ?? "Unable to create setting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full text-left">
      <div className="flex items-center gap-2 pb-5">
        <Settings size={20} className="text-primary" />
        <h2 className="text-headline-md text-on-surface">New System Setting</h2>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {formError}
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
          Setting Key
        </label>
        <input
          type="text"
          value={settingKey}
          onChange={(e) => setSettingKey(e.target.value.toUpperCase())}
          placeholder="FAMILY_VEHICLE_CHANGE_LOCK_DAYS"
          className={`w-full rounded-lg border px-4 py-2.5 font-mono text-body-md text-on-surface outline-none transition-colors placeholder:font-sans placeholder:text-on-surface-variant/60 ${
            keyError ? "border-error" : "border-outline-variant focus:border-primary"
          }`}
        />
        {keyError && <p className="mt-1.5 text-label-md text-error">{keyError}</p>}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
            Category
          </label>
          <input
            type="text"
            list="existing-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Booking Rules"
            className="w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
          />
          <datalist id="existing-categories">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
            Data Type
          </label>
          <select
            value={dataType}
            onChange={(e) => {
              setDataType(e.target.value as SettingDataType);
              // BOOLEAN cần giá trị hợp lệ ngay (select luôn hiện sẵn "true"/"false", không có
              // placeholder rỗng) - nếu chỉ để settingValue="" thì validate sẽ báo sai "required"
              // dù dropdown đang hiển thị "true".
              setSettingValue(e.target.value === "BOOLEAN" ? "true" : "");
              setValueError(null);
            }}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
          >
            {DATA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
          Value
        </label>
        {dataType === "BOOLEAN" ? (
          <select
            value={settingValue}
            onChange={(e) => setSettingValue(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input
            type={dataType === "NUMBER" ? "number" : "text"}
            value={settingValue}
            onChange={(e) => setSettingValue(e.target.value)}
            placeholder={dataType === "NUMBER" ? "30" : "some text value"}
            className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
              valueError ? "border-error" : "border-outline-variant focus:border-primary"
            }`}
          />
        )}
        {valueError && <p className="mt-1.5 text-label-md text-error">{valueError}</p>}
      </div>

      <div className="mb-2">
        <label className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
          Description
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this setting control?"
          className="w-full resize-none rounded-lg border border-outline-variant px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary"
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-ice disabled:opacity-50"
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
          {isSubmitting ? "Creating..." : "Create Setting"}
        </button>
      </div>
    </form>
  );
}

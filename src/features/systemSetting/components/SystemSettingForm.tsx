import { useState } from "react";
import { Save, Settings } from "lucide-react";
import { createSetting, updateSetting } from "../api/systemSettingApi";
import type { DataType, SystemSetting } from "../types/systemSetting";
import { getApiErrorInfo } from "../../../lib/axiosClient";

const SETTING_KEY_REGEX = /^[A-Z][A-Z0-9_]*$/;

interface SystemSettingFormProps {
  mode: "create" | "edit";
  setting?: SystemSetting; // prefill khi edit
  categories?: string[]; // dropdown category, chỉ cần khi create
  onSuccess: (message?: string) => void;
  onCancel: () => void;
}

// Field read-only dùng trong edit mode để hiển thị context
function ReadOnlyField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low/60 px-4 py-2.5">
        {children}
      </div>
    </div>
  );
}

export default function SystemSettingForm({
  mode,
  setting,
  categories = [],
  onSuccess,
  onCancel,
}: SystemSettingFormProps) {
  // State cho create mode
  const [settingKey, setSettingKey] = useState("");
  const [dataType, setDataType] = useState<DataType>("NUMBER");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0] ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [description, setDescription] = useState("");

  // setting_value dùng chung cả 2 mode
  const [settingValue, setSettingValue] = useState(
    mode === "edit" ? (setting?.setting_value ?? "") : "",
  );

  // Errors
  const [keyError, setKeyError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // data_type hiện hành: edit → từ prop (read-only), create → từ state
  const activeDataType: DataType =
    mode === "edit" ? (setting?.data_type ?? "STRING") : dataType;
  const effectiveCategory = isNewCategory
    ? newCategoryName.trim()
    : selectedCategory;

  function handleKeyChange(raw: string) {
    setSettingKey(
      raw
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, ""),
    );
    setKeyError(null);
  }

  function handleDataTypeChange(newType: DataType) {
    setDataType(newType);
    setSettingValue(newType === "BOOLEAN" ? "false" : "");
    setValueError(null);
  }

  function handleCategorySelect(value: string) {
    if (value === "__new__") {
      setIsNewCategory(true);
      setSelectedCategory("");
    } else {
      setIsNewCategory(false);
      setSelectedCategory(value);
    }
    setCategoryError(null);
  }

  function validate(): boolean {
    let valid = true;
    setKeyError(null);
    setValueError(null);
    setCategoryError(null);

    if (mode === "create") {
      if (!settingKey.trim()) {
        setKeyError("Setting key is required.");
        valid = false;
      } else if (!SETTING_KEY_REGEX.test(settingKey)) {
        setKeyError(
          "Must be UPPER_SNAKE_CASE (letters, digits, underscores, start with a letter).",
        );
        valid = false;
      }
      if (isNewCategory && !newCategoryName.trim()) {
        setCategoryError("Please enter a name for the new category.");
        valid = false;
      }
    }

    if (activeDataType !== "BOOLEAN") {
      if (!settingValue.trim()) {
        setValueError("Value is required.");
        valid = false;
      } else if (activeDataType === "NUMBER" && isNaN(Number(settingValue))) {
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
      if (mode === "create") {
        const { message } = await createSetting({
          setting_key: settingKey,
          setting_value:
            activeDataType === "BOOLEAN"
              ? settingValue || "false"
              : settingValue.trim(),
          category: effectiveCategory,
          data_type: dataType,
          description: description.trim(),
        });
        onSuccess(message);
      } else {
        // Edit: chỉ gửi setting_value theo API-35-03
        const { message } = await updateSetting(setting!.id, {
          setting_value:
            activeDataType === "BOOLEAN" ? settingValue : settingValue.trim(),
        });
        onSuccess(message);
      }
    } catch (error) {
      const { errorCode, message } = getApiErrorInfo(error);
      if (errorCode === "DUPLICATE_SETTING_KEY") {
        setKeyError(message ?? "This setting key already exists.");
      } else if (errorCode === "INVALID_SETTING_VALUE") {
        setValueError(message ?? "Invalid value for this setting.");
      } else {
        setFormError(message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderValueInput() {
    if (activeDataType === "BOOLEAN") {
      return (
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
      );
    }
    return (
      <input
        type={activeDataType === "NUMBER" ? "number" : "text"}
        value={settingValue}
        onChange={(e) => {
          setSettingValue(e.target.value);
          setValueError(null);
        }}
        placeholder={activeDataType === "NUMBER" ? "e.g. 30" : "e.g. 1900-1234"}
        className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
          valueError
            ? "border-error"
            : "border-outline-variant focus:border-primary"
        }`}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]"
    >
      <div className="flex items-center gap-2 pb-6">
        <Settings size={20} className="text-primary" />
        <h2 className="text-headline-md text-on-surface">
          {mode === "create" ? "Setting Configuration" : "Edit Setting"}
        </h2>
      </div>

      {formError && (
        <div className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {formError}
        </div>
      )}

      {/* Note chỉ hiện trong edit mode */}
      {mode === "edit" && (
        <div className="mb-5 rounded-lg border border-primary/20 bg-primary-container/10 px-4 py-3 text-sm text-on-surface-variant">
          Only the <span className="font-semibold text-on-surface">Value</span>{" "}
          field can be modified. Other fields are read-only.
        </div>
      )}

      {/* CREATE MODE: tất cả fields editable */}
      {mode === "create" && (
        <>
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
                Auto-formatted to UPPER_SNAKE_CASE. Must be unique across the
                system.
              </p>
            )}
          </div>
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
                onChange={(e) =>
                  handleDataTypeChange(e.target.value as DataType)
                }
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
                value={isNewCategory ? "__new__" : selectedCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__new__">＋ New category...</option>
              </select>
            </div>
          </div>

          {isNewCategory && (
            <div className="mb-5">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  setCategoryError(null);
                }}
                placeholder="e.g. Notification Rules"
                className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
                  categoryError
                    ? "border-error"
                    : "border-outline-variant focus:border-primary"
                }`}
              />
              {categoryError && (
                <p className="mt-1.5 text-label-md text-error">
                  {categoryError}
                </p>
              )}
            </div>
          )}
          {!isNewCategory && categoryError && (
            <p className="-mt-3 mb-5 text-label-md text-error">
              {categoryError}
            </p>
          )}
        </>
      )}

      {/* EDIT MODE: read-only fields cho context */}
      {mode === "edit" && setting && (
        <div className="mb-5 grid grid-cols-1 gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ReadOnlyField label="Setting Key">
              <span className="font-mono text-sm font-bold text-on-surface">
                {setting.setting_key}
              </span>
            </ReadOnlyField>
            <ReadOnlyField label="Data Type">
              <span className="text-sm text-on-surface">
                {setting.data_type}
              </span>
            </ReadOnlyField>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ReadOnlyField label="Category">
              <span className="text-sm text-on-surface">
                {setting.category ?? "—"}
              </span>
            </ReadOnlyField>
            <ReadOnlyField label="Description">
              <span className="text-sm text-on-surface-variant">
                {setting.description || "—"}
              </span>
            </ReadOnlyField>
          </div>
        </div>
      )}

      {/* VALUE — editable cả 2 mode */}
      <div className="mb-5">
        <label className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
          Value
        </label>
        {renderValueInput()}
        {valueError && (
          <p className="mt-1.5 text-label-md text-error">{valueError}</p>
        )}
      </div>

      {/* DESCRIPTION — chỉ editable trong create mode */}
      {mode === "create" && (
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
      )}

      <div className="my-7 border-t border-outline-variant" />

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-outline-variant px-4 py-2 text-body-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
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
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Save Setting"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

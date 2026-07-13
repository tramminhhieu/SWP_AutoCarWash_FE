import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Settings } from "lucide-react";
import { getAllSettings, updateSetting } from "../api/systemSettingApi";
import type {
  SystemSetting,
  SystemSettingsGrouped,
} from "../types/systemSetting";
import { getApiErrorInfo } from "../../../lib/axiosClient";

// Config badge hiển thị theo data_type
const DATA_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  NUMBER: {
    label: "Number",
    className: "text-secondary border-secondary/20 bg-secondary-container/20",
  },
  STRING: {
    label: "String",
    className:
      "text-on-surface-variant border-outline-variant/50 bg-surface-container",
  },
  BOOLEAN: {
    label: "Boolean",
    className: "text-primary border-primary/20 bg-primary-container/20",
  },
};

// ─── SettingRow ────────────────────────────────────────────────────────────────
// Component con xử lý inline edit riêng biệt cho từng setting
function SettingRow({
  setting,
  onUpdated,
}: {
  setting: SystemSetting;
  onUpdated: (updated: SystemSetting) => void;
}) {
  const [localValue, setLocalValue] = useState(setting.setting_value);
  const [syncedValue, setSyncedValue] = useState(setting.setting_value);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // localValue bị dirty khi khác với giá trị gốc từ prop
  const isDirty = localValue !== setting.setting_value;
  const badge = DATA_TYPE_BADGE[setting.data_type] ?? DATA_TYPE_BADGE.STRING;

  // Đồng bộ lại khi prop thay đổi (sau khi save thành công, parent cập nhật prop)
  // Cập nhật ngay trong lúc render thay vì trong useEffect — tránh cascading render
  if (setting.setting_value !== syncedValue) {
    setSyncedValue(setting.setting_value);
    setLocalValue(setting.setting_value);
  }

  // Gọi API update, dùng chung cho cả NUMBER/STRING (qua nút Save) và BOOLEAN (qua toggle)
  const callUpdateApi = useCallback(
    async (valueToSave: string) => {
      setSaveError(null);
      setIsSaving(true);
      try {
        const { setting: updated } = await updateSetting(setting.id, {
          setting_value: valueToSave,
        });
        onUpdated(updated);
        setSaveSuccess(true);
        // Tự ẩn badge "Saved" sau 2 giây
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (error) {
        const { message } = getApiErrorInfo(error);
        setSaveError(message ?? "Failed to update. Please try again.");
        // Revert về giá trị cũ nếu API báo lỗi
        setLocalValue(setting.setting_value);
      } finally {
        setIsSaving(false);
      }
    },
    [setting.id, setting.setting_value, onUpdated],
  );

  // NUMBER/STRING: bấm Save hoặc Enter để lưu
  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return;
    if (!localValue.trim()) {
      setSaveError("Value cannot be empty.");
      return;
    }
    if (setting.data_type === "NUMBER" && isNaN(Number(localValue))) {
      setSaveError("Value must be a valid number.");
      return;
    }
    await callUpdateApi(localValue);
  }, [isDirty, isSaving, localValue, setting.data_type, callUpdateApi]);

  // BOOLEAN: toggle tự lưu ngay, không cần bấm Save
  const handleToggle = async () => {
    if (isSaving) return;
    const newValue = localValue === "true" ? "false" : "true";
    setLocalValue(newValue);
    await callUpdateApi(newValue);
  };

  return (
    <div className="flex items-center gap-6 rounded-[16px] border border-outline-variant/50 bg-white px-6 py-5 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-shadow hover:shadow-[0_10px_25px_-5px_rgba(29,78,216,0.1)]">
      {/* Left: key + mô tả */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-wide text-on-surface">
            {setting.setting_key}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          {/* Badge "Saved" nhỏ sau khi lưu thành công */}
          {saveSuccess && (
            <span className="text-xs font-semibold text-tertiary-container">
              ✓ Saved
            </span>
          )}
        </div>

        {setting.description && (
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {setting.description}
          </p>
        )}

        {/* Lỗi validation hoặc lỗi từ BE hiển thị inline dưới description */}
        {saveError && (
          <p className="text-xs font-medium text-error">{saveError}</p>
        )}
      </div>

      {/* Right: input control tuỳ theo data_type */}
      <div className="flex shrink-0 items-center gap-3">
        {setting.data_type === "BOOLEAN" ? (
          // Toggle: bấm là lưu ngay
          <button
            onClick={handleToggle}
            disabled={isSaving}
            title={
              localValue === "true" ? "Click to disable" : "Click to enable"
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-60 ${
              localValue === "true" ? "bg-primary" : "bg-outline-variant"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                localValue === "true" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        ) : (
          <>
            <input
              type={setting.data_type === "NUMBER" ? "number" : "text"}
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                setSaveError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              disabled={isSaving}
              className={`w-36 rounded-[8px] border px-3 py-2 text-sm text-on-surface outline-none transition-colors disabled:opacity-60 ${
                isDirty
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-outline-variant"
              } focus:border-primary`}
            />
            {/* Nút Save chỉ hiện khi giá trị đã thay đổi */}
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-[8px] bg-primary px-4 py-2 text-xs font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── SystemSettingList ─────────────────────────────────────────────────────────
export default function SystemSettingList() {
  const navigate = useNavigate();
  const [grouped, setGrouped] = useState<SystemSettingsGrouped>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllSettings()
      .then((data) => {
        setGrouped(data);
        // Chọn tab đầu tiên mặc định sau khi load xong
        const firstCategory = Object.keys(data)[0];
        if (firstCategory) setActiveTab(firstCategory);
      })
      .catch(() =>
        setError("Failed to load system settings. Please try again."),
      )
      .finally(() => setIsLoading(false));
  }, []);

  // Cập nhật setting trong grouped state sau khi inline edit thành công
  // Tìm theo id vì setting có thể nằm ở bất kỳ category nào
  const handleSettingUpdated = useCallback((updated: SystemSetting) => {
    setGrouped((prev) => {
      const next = { ...prev };
      for (const cat of Object.keys(next)) {
        next[cat] = next[cat].map((s) =>
          s.id === updated.id
            ? { ...s, setting_value: updated.setting_value }
            : s,
        );
      }
      return next;
    });
  }, []);

  const categories = Object.keys(grouped);
  const currentSettings = grouped[activeTab] ?? [];

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-outline">Admin</span>
            <ChevronRight className="size-3 text-outline" />
            <span className="text-xs font-semibold text-on-surface-variant">
              System Settings
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[8px] border border-primary/10 bg-primary/5">
              <Settings className="size-5 text-primary" />
            </div>
            <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
              System Settings
            </h1>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Configure system-wide rules and parameters. Changes take effect
            immediately.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/system-settings/new")}
          className="flex items-center gap-2 rounded-[8px] bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Add New Setting
        </button>
      </div>

      {/* Tab bar — động theo category từ BE, không hardcode */}
      {!isLoading && !error && categories.length > 0 && (
        <div className="flex gap-8 border-b border-outline-variant/30">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`pb-[26px] text-sm tracking-[0.14px] transition-colors ${
                activeTab === cat
                  ? "border-b-2 border-primary font-semibold text-primary"
                  : "font-medium text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="flex h-48 items-center justify-center text-base text-error">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          Loading settings...
        </div>
      ) : currentSettings.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          No settings in this category.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {currentSettings.map((setting) => (
            <SettingRow
              key={setting.id}
              setting={setting}
              onUpdated={handleSettingUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

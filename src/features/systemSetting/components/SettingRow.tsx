import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { updateSystemSetting } from "../api/systemSettingApi";
import {
  SYSTEM_SETTING_ERROR_CODES,
  type SystemSettingDto,
} from "../types/systemSetting";

// Tài liệu API-35 chỉ nêu rõ 1 errorCode (INVALID_SETTING_VALUE) - các lỗi khác fallback dùng
// message thô từ BE (đã ghi rõ trong types/systemSetting.ts, comment tương tự).
function getSettingErrorMessage(
  errorCode: string | null,
  fallbackMessage: string | null,
): string {
  if (errorCode === SYSTEM_SETTING_ERROR_CODES.INVALID_SETTING_VALUE) {
    return fallbackMessage ?? "Invalid value for this setting.";
  }
  return fallbackMessage ?? "Unable to save this setting. Please try again.";
}

// Nhập là lưu (API-35-03): mỗi dòng cấu hình tự quản lý state riêng, render input theo
// data_type như tài liệu gợi ý - BOOLEAN lưu ngay khi gạt, NUMBER/STRING cần bấm Save.
export default function SettingRow({ setting }: { setting: SystemSettingDto }) {
  const [current, setCurrent] = useState(setting);
  const [draftValue, setDraftValue] = useState(setting.setting_value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = draftValue !== current.setting_value;

  const save = async (nextValue: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateSystemSetting(current.id, {
        setting_value: nextValue,
      });
      setCurrent(updated);
      setDraftValue(updated.setting_value);
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setError(getSettingErrorMessage(errorCode, message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-body-md font-semibold text-on-surface">
          {current.setting_key}
        </p>
        {current.description && (
          <p className="mt-0.5 text-label-md text-on-surface-variant">
            {current.description}
          </p>
        )}
        {error && <p className="mt-1.5 text-label-sm text-error">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {current.data_type === "BOOLEAN" ? (
          <button
            type="button"
            role="switch"
            aria-checked={current.setting_value === "true"}
            disabled={isSaving}
            onClick={() =>
              save(current.setting_value === "true" ? "false" : "true")
            }
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              current.setting_value === "true"
                ? "bg-primary"
                : "bg-surface-container-high"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
                current.setting_value === "true"
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        ) : (
          <>
            <input
              type={current.data_type === "NUMBER" ? "number" : "text"}
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              disabled={isSaving}
              className="w-32 rounded-lg border border-outline-variant px-3 py-2 text-body-md text-on-surface outline-none transition-colors focus:border-primary disabled:opacity-50"
            />
            {isDirty && (
              <button
                type="button"
                onClick={() => save(draftValue)}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-label-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Save
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

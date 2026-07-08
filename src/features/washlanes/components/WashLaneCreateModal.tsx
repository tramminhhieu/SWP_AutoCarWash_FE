import { useState } from "react";
import { X } from "lucide-react";
import { createLane } from "../api/washlaneApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";

// Map errorCode BE → message tiếng Việt hiển thị trên form
const API_ERROR_MAP: Record<string, string> = {
  LANE_NAME_ALREADY_EXISTS: "Tên làn rửa xe đã tồn tại trong trạm này.",
  INVALID_PRIORITY_VALUE:
    "Số lượt xe đặt trước ưu tiên phải là một số nguyên dương lớn hơn 0.",
  STATION_NOT_AVAILABLE: "Trạm không tồn tại hoặc đã ngừng hoạt động.",
};

interface CreateLaneModalProps {
  stationId: number;
  stationName: string;
  onClose: () => void;
  /** Gọi sau khi tạo thành công — page dùng để refresh bảng lanes */
  onSuccess: () => void;
}

const CreateLaneModal = ({
  stationId,
  stationName,
  onClose,
  onSuccess,
}: CreateLaneModalProps) => {
  const [laneName, setLaneName] = useState("");
  const [status, setStatus] = useState<"AVAILABLE" | "MAINTENANCE">(
    "AVAILABLE",
  );
  const [ratio, setRatio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lỗi validate FE (theo field) + lỗi từ BE (chung)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  // Toast thành công
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validate FE — chặn cứng trước khi gọi API
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!laneName.trim()) {
      errors.laneName = "Lane name must not be blank";
    }

    const ratioNum = Number(ratio);
    if (!ratio || !Number.isInteger(ratioNum) || ratioNum <= 0) {
      errors.ratio =
        "Số lượt xe đặt trước ưu tiên phải là một số nguyên dương lớn hơn 0 (Tối thiểu là 1)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createLane({
        stationId,
        laneName: laneName.trim(),
        status,
        bookingWalkinRatio: Number(ratio),
      });

      // Thành công → hiện toast rồi đóng modal
      setSuccessMessage(
        `Thêm làn rửa xe và cấu hình tỷ lệ thành công tại ${stationName}!`,
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setApiError(
        API_ERROR_MAP[errorCode ?? ""] ??
          message ??
          "Có lỗi xảy ra. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Style chung cho input
  const inputClass =
    "w-full rounded-lg border bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.12)]">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-headline text-headline-md text-on-surface">
            Thêm làn rửa mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast thành công */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-tertiary/20 bg-tertiary-fixed/15 px-4 py-3 text-body-md font-medium text-tertiary-fixed-dim">
            {successMessage}
          </div>
        )}

        {/* Lỗi từ BE */}
        {apiError && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-body-md text-error">
            {apiError}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          {/* Tên làn */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Tên làn <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Làn 01"
              value={laneName}
              onChange={(e) => {
                setLaneName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, laneName: "" }));
              }}
              className={`${inputClass} ${fieldErrors.laneName ? "border-error" : "border-outline-variant"}`}
            />
            {fieldErrors.laneName && (
              <p className="mt-1 text-label-sm text-error">
                {fieldErrors.laneName}
              </p>
            )}
          </div>

          {/* Trạng thái */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "AVAILABLE" | "MAINTENANCE")
              }
              className={`${inputClass} border-outline-variant`}
            >
              <option value="AVAILABLE">Sẵn sàng (Available)</option>
              <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
            </select>
          </div>

          {/* Tỷ lệ booking/walk-in */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Booking / Walk-in Ratio <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={1}
              placeholder="VD: 3"
              value={ratio}
              onChange={(e) => {
                setRatio(e.target.value);
                setFieldErrors((prev) => ({ ...prev, ratio: "" }));
              }}
              className={`${inputClass} ${fieldErrors.ratio ? "border-error" : "border-outline-variant"}`}
            />
            {fieldErrors.ratio && (
              <p className="mt-1 text-label-sm text-error">
                {fieldErrors.ratio}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-outline-variant px-5 py-2.5 text-body-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Đang tạo..." : "Tạo làn"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLaneModal;

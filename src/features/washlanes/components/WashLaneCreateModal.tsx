import { useState } from "react";
import { X } from "lucide-react";
import { createLane } from "../api/washlaneApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";

// Map errorCode from BE → user-facing error message
const API_ERROR_MAP: Record<string, string> = {
  LANE_NAME_ALREADY_EXISTS: "Lane name already exists in this station.",
  INVALID_PRIORITY_VALUE:
    "Booking priority ratio must be a positive integer greater than 0.",
  STATION_NOT_AVAILABLE: "Station does not exist or is no longer operating.",
};

interface CreateLaneModalProps {
  stationId: number;
  stationName: string;
  onClose: () => void;
  /** Called after successful creation — page uses this to refresh the lane table */
  onSuccess: () => void;
}

const CreateLaneModal = ({
  stationId,
  stationName,
  onClose,
  onSuccess,
}: CreateLaneModalProps) => {
  const [laneName, setLaneName] = useState("");
  const STATUS_ON_CREATE = "AVAILABLE" as const;
  const [ratio, setRatio] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // FE field-level errors + BE error
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // FE validation — block submission if invalid
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!laneName.trim()) {
      errors.laneName = "Lane name must not be blank.";
    }

    const ratioNum = Number(ratio);
    if (!ratio || !Number.isInteger(ratioNum) || ratioNum <= 0) {
      errors.ratio =
        "Booking priority ratio must be a positive integer greater than 0 (minimum 1).";
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
        status: STATUS_ON_CREATE,
        bookingWalkinRatio: Number(ratio),
      });

      setSuccessMessage(
        `Wash lane created and ratio configured successfully at ${stationName}!`,
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
          "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.12)]">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-headline text-headline-md text-on-surface">
            Add New Wash Lane
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-tertiary/20 bg-tertiary-fixed/15 px-4 py-3 text-body-md font-medium text-tertiary-fixed-dim">
            {successMessage}
          </div>
        )}

        {/* BE error */}
        {apiError && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-body-md text-error">
            {apiError}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          {/* Lane name */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Lane Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Lane 01"
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

          {/* Booking / Walk-in Ratio */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Booking / Walk-in Ratio <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={1}
              placeholder="e.g. 3"
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Lane"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLaneModal;

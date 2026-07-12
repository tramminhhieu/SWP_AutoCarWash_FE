import { useState } from "react";
import { Sparkles, Save } from "lucide-react";
import type { AddonService, CreateAddonRequest } from "../types/addon";

interface AddonFormProps {
  /** Data có sẵn để fill form (edit mode). Không truyền = create mode (form trống). */
  initialData?: AddonService;
  /** Page cha truyền vào — gọi API tương ứng (create hoặc update), trả về message thành công. */
  onSubmit: (data: CreateAddonRequest) => Promise<string>;
  onCancel: () => void;
  /** Label nút submit — mặc định "Save Add-on" */
  submitLabel?: string;
}

const AddonForm = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Add-on",
}: AddonFormProps) => {
  /* Khởi tạo state từ initialData (edit) hoặc rỗng (create) */
  const [name, setName] = useState(initialData?.name ?? "");
  const [price, setPrice] = useState(
    initialData ? String(initialData.price) : "",
  );
  const [duration, setDuration] = useState(
    initialData ? String(initialData.durationMinutes) : "",
  );
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );

  /* Lỗi riêng từng field */
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  /* Lỗi chung (mạng, auth, SERVICE_001…) */
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- Validation — khớp AC-15.1 & AC-15.2 ---------- */
  const validate = (): boolean => {
    let isValid = true;
    setNameError(null);
    setPriceError(null);
    setDurationError(null);

    /* AC-15.1.4: name rỗng hoặc bắt đầu bằng số */
    if (!name.trim()) {
      setNameError("Addon service name is required");
      isValid = false;
    } else if (/^\d/.test(name.trim())) {
      setNameError("Service name cannot start with a number");
      isValid = false;
    }

    /* price <= 0 → AC-15.1.2 / AC-15.2.2 */
    const priceNum = Number(price);
    if (!price.trim() || isNaN(priceNum) || priceNum <= 0) {
      setPriceError("Addon service price must be greater than 0");
      isValid = false;
    }

    /* durationMinutes phải là bội 15 (cho phép 0) → AC-15.1.3 / AC-15.2.2 */
    const durNum = Number(duration);
    if (duration.trim() === "" || isNaN(durNum) || durNum < 0) {
      setDurationError("Duration is required and must be 0 or positive");
      isValid = false;
    } else if (durNum % 15 !== 0) {
      setDurationError("Duration must be a multiple of 15 minutes");
      isValid = false;
    }

    return isValid;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload: CreateAddonRequest = {
        name: name.trim(),
        price: Number(price),
        durationMinutes: Number(duration),
        description: description.trim() || null,
      };

      /* Page cha quyết định gọi create hay update */
      const successMessage = await onSubmit(payload);

      /* Nếu không throw = thành công, page cha tự xử lý redirect.
         Trường hợp page cha muốn dùng message thì đã nhận qua Promise. */
      void successMessage; // page cha đã handle
    } catch (error) {
      /* Page cha có thể throw lại error để form hiển thị */
      const msg =
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi. Vui lòng thử lại.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-6">
        <Sparkles size={20} className="text-primary" />
        <h2 className="text-headline-md text-on-surface">Add-on Information</h2>
      </div>

      {/* Lỗi chung */}
      {formError && (
        <div className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {formError}
        </div>
      )}

      {/* Name — full width */}
      <div className="mb-5">
        <label
          htmlFor="addonName"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          Service Name
        </label>
        <input
          id="addonName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wax Coating"
          className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
            ${nameError ? "border-error" : "border-outline-variant focus:border-primary"}`}
        />
        {nameError && (
          <p className="mt-1.5 text-label-md text-error">{nameError}</p>
        )}
      </div>

      {/* Price + Duration — 2 cột */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Price */}
        <div>
          <label
            htmlFor="addonPrice"
            className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
          >
            Price (VND)
          </label>
          <input
            id="addonPrice"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="20000"
            className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
    ${priceError ? "border-error" : "border-outline-variant focus:border-primary"}`}
          />

          {priceError && (
            <p className="mt-1.5 text-label-md text-error">{priceError}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label
            htmlFor="addonDuration"
            className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
          >
            Duration (minutes)
          </label>
          <input
            id="addonDuration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="15"
            className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
              ${durationError ? "border-error" : "border-outline-variant focus:border-primary"}`}
          />
          {durationError && (
            <p className="mt-1.5 text-label-md text-error">{durationError}</p>
          )}
        </div>
      </div>

      {/* Description — textarea optional */}
      <div className="mb-5">
        <label
          htmlFor="addonDesc"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          Description{" "}
          <span className="normal-case tracking-normal text-on-surface-variant/60">
            (optional)
          </span>
        </label>
        <textarea
          id="addonDesc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the add-on service..."
          className="w-full resize-none rounded-lg border border-outline-variant px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary"
        />
      </div>

      {/* Divider */}
      <div className="my-7 border-t border-outline-variant" />

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4">
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
          className={`flex items-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors
            ${
              isSubmitting
                ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                : "bg-primary text-on-primary hover:opacity-90"
            }`}
        >
          <Save size={16} />
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default AddonForm;

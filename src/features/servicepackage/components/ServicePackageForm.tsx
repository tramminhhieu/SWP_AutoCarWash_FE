import { useState, useEffect, useMemo } from "react";
import { Package, Save, Clock, Loader2 } from "lucide-react";
import { getAllAddonServices } from "../../addon/api/addonApi";
import type { AddonService } from "../../addon/types/addon";

/* ================================================================
   Props — form dùng chung cho Create và Edit
   ================================================================ */
export interface ServicePackageFormData {
  name: string;
  basePrice: number;
  description: string | null;
  addonIds: number[];
}

export interface ServicePackageFormProps {
  /** Data ban đầu — truyền vào khi Edit, bỏ trống khi Create. */
  initialData?: {
    name: string;
    basePrice: number;
    description: string | null;
    addonIds: number[];
  };
  /** Callback khi user bấm Save — page cha xử lý gọi API. */
  onSubmit: (data: ServicePackageFormData) => Promise<void>;
  /** Callback khi user bấm Cancel. */
  onCancel: () => void;
  /** Label hiển thị trên nút Save (mặc định "Save Package"). */
  submitLabel?: string;
  /** Lỗi từ API trả về — page cha truyền vào để hiển thị trong form. */
  apiError?: string | null;
}

/* ================================================================
   Sub-component: 1 item addon trong picker — checkbox card
   ================================================================ */
function AddonPickerItem({
  addon,
  isSelected,
  onToggle,
}: {
  addon: AddonService;
  isSelected: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(addon.id)}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors
        ${
          isSelected
            ? "border-primary bg-primary/5"
            : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
        }`}
    >
      {/* Checkbox */}
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors
          ${
            isSelected
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant"
          }`}
      >
        {isSelected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-medium text-on-surface">{addon.name}</p>
        {addon.description && (
          <p className="mt-0.5 text-label-sm text-on-surface-variant line-clamp-1">
            {addon.description}
          </p>
        )}
      </div>

      {/* Duration badge */}
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-label-sm font-medium text-on-surface-variant">
        <Clock size={12} />
        {addon.durationMinutes}m
      </span>
    </button>
  );
}

/* ================================================================
   ServicePackageForm — form dùng chung Create / Edit
   ================================================================ */
export default function ServicePackageForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Package",
  apiError,
}: ServicePackageFormProps) {
  /* ---- State: addon list cho picker ---- */
  const [allAddons, setAllAddons] = useState<AddonService[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState(true);
  const [addonLoadError, setAddonLoadError] = useState<string | null>(null);

  /* ---- State: form fields ---- */
  const [name, setName] = useState(initialData?.name ?? "");
  const [basePrice, setBasePrice] = useState(
    initialData?.basePrice != null ? String(initialData.basePrice) : "",
  );
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>(
    initialData?.addonIds ?? [],
  );

  /* ---- State: validation errors ---- */
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [addonError, setAddonError] = useState<string | null>(null);

  /* ---- State: submit ---- */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---- Load danh sách addon khi mở form ---- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingAddons(true);
      setAddonLoadError(null);
      try {
        const data = await getAllAddonServices();
        if (!cancelled) setAllAddons(data);
      } catch {
        if (!cancelled)
          setAddonLoadError(
            "Unable to load add-on services. Please try again.",
          );
      } finally {
        if (!cancelled) setIsLoadingAddons(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- Duration read-only = tổng durationMinutes của addon đang tick ---- */
  const totalDuration = useMemo(() => {
    return allAddons
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((sum, a) => sum + a.durationMinutes, 0);
  }, [allAddons, selectedAddonIds]);

  /* ---- Toggle addon selection ---- */
  const toggleAddon = (id: number) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    if (addonError) setAddonError(null);
  };

  /* ---- Validation ---- */
  const validate = (): boolean => {
    let isValid = true;
    setNameError(null);
    setPriceError(null);
    setAddonError(null);

    if (!name.trim()) {
      setNameError("Package name is required");
      isValid = false;
    } else if (/^\d/.test(name.trim())) {
      setNameError("Package name cannot start with a number");
      isValid = false;
    }

    const priceNum = Number(basePrice);
    if (!basePrice.trim() || isNaN(priceNum) || priceNum <= 0) {
      setPriceError("Package price must be greater than 0");
      isValid = false;
    }

    if (selectedAddonIds.length === 0) {
      setAddonError("Please select at least one included service");
      isValid = false;
    }

    return isValid;
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        basePrice: Number(basePrice),
        description: description.trim() || null,
        addonIds: selectedAddonIds,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================================================================ */
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-6">
        <Package size={20} className="text-primary" />
        <h2 className="text-headline-md text-on-surface">
          Package Information
        </h2>
      </div>

      {/* Lỗi chung từ API */}
      {apiError && (
        <div className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {apiError}
        </div>
      )}

      {/* Name — full width */}
      <div className="mb-5">
        <label
          htmlFor="pkgName"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          Package Name
        </label>
        <input
          id="pkgName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Premium Detailing Combo"
          className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
            ${nameError ? "border-error" : "border-outline-variant focus:border-primary"}`}
        />
        {nameError && (
          <p className="mt-1.5 text-label-md text-error">{nameError}</p>
        )}
      </div>

      {/* Base Price + Estimated Duration — 2 cột */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Base Price */}
        <div>
          <label
            htmlFor="pkgPrice"
            className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
          >
            Base Price (VND)
          </label>
          <input
            id="pkgPrice"
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="150000"
            className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
              ${priceError ? "border-error" : "border-outline-variant focus:border-primary"}`}
          />
          {priceError && (
            <p className="mt-1.5 text-label-md text-error">{priceError}</p>
          )}
        </div>

        {/* Estimated Duration — read-only, tính từ addon đang chọn */}
        <div>
          <label className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant">
            Estimated Duration
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-4 py-2.5">
            <Clock size={16} className="text-on-surface-variant" />
            <span className="text-body-md font-medium text-on-surface">
              {totalDuration} min
            </span>
            {selectedAddonIds.length > 0 && (
              <span className="text-label-sm text-on-surface-variant">
                ({selectedAddonIds.length} service
                {selectedAddonIds.length > 1 ? "s" : ""})
              </span>
            )}
          </div>
          <p className="mt-1.5 text-label-sm text-on-surface-variant">
            Auto-calculated from selected services below
          </p>
        </div>
      </div>

      {/* Description — optional */}
      <div className="mb-5">
        <label
          htmlFor="pkgDesc"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          Description{" "}
          <span className="normal-case tracking-normal text-on-surface-variant/60">
            (optional)
          </span>
        </label>
        <textarea
          id="pkgDesc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this package includes..."
          className="w-full resize-none rounded-lg border border-outline-variant px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary"
        />
      </div>

      {/* Divider trước addon picker */}
      <div className="my-7 border-t border-outline-variant" />

      {/* Included Services — addon picker */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-label-md uppercase tracking-wide text-on-surface-variant">
            Included Services
          </label>
          {selectedAddonIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedAddonIds([])}
              className="text-label-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Clear all
            </button>
          )}
        </div>

        {addonError && (
          <p className="mb-3 text-label-md text-error">{addonError}</p>
        )}

        {isLoadingAddons ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest py-10 text-on-surface-variant">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-body-md">Loading add-on services...</span>
          </div>
        ) : addonLoadError ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-error/20 bg-error-container/10 py-10 text-center">
            <p className="text-body-md text-error">{addonLoadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-label-md font-medium text-error transition-colors hover:text-error/80"
            >
              Retry
            </button>
          </div>
        ) : allAddons.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest py-10 text-center text-body-md text-on-surface-variant">
            No add-on services available. Please create add-ons first.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {allAddons.map((addon) => (
              <AddonPickerItem
                key={addon.id}
                addon={addon}
                isSelected={selectedAddonIds.includes(addon.id)}
                onToggle={toggleAddon}
              />
            ))}
          </div>
        )}
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
          disabled={isSubmitting || isLoadingAddons}
          className={`flex items-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors
            ${
              isSubmitting || isLoadingAddons
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
}

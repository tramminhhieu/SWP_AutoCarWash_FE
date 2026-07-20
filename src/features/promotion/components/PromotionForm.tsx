import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import {
  getProvinces,
  getCommunesByProvince,
} from "../../station/api/addressApi";
import { getStationsByCommune } from "../../station/api/stationApi";
import type { Station } from "../../station/types/station";
import type {
  PromotionItem,
  VoucherFormItem,
  PromotionFormValues,
  DiscountType,
} from "../types/promotion";

// Re-export để các nơi đang import VoucherFormItem/PromotionFormValues
// từ "components/PromotionForm" (như PromotionCreate.tsx) không bị breaking change
export type { VoucherFormItem, PromotionFormValues };

// ─── Constants ───────────────────────────────────────────────────────────────

const CUSTOMER_TIERS = [
  { id: 1, name: "Member" },
  { id: 2, name: "Silver" },
  { id: 3, name: "Gold" },
  { id: 4, name: "Platinum" },
];

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = getLocalDateString(new Date());

// ─── Validation ───────────────────────────────────────────────────────────────
// Không export function này ra ngoài — nếu export, ESLint sẽ báo lỗi
// react-refresh/only-export-components vì file component chỉ nên export component.

function validatePromotionForm(
  values: PromotionFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.campaignName.trim())
    errors.campaignName = "This field is required.";
  else if (values.campaignName.length > 100)
    errors.campaignName = "Campaign name must not exceed 100 characters.";

  if (values.description.length > 500)
    errors.description = "Description must not exceed 500 characters.";

  if (!values.startDate) errors.startDate = "This field is required.";
  else if (values.startDate < today)
    errors.startDate = "Start date cannot be in the past.";

  if (!values.endDate) errors.endDate = "This field is required.";
  else if (values.endDate < today)
    errors.endDate = "End date cannot be in the past.";
  else if (values.startDate && values.endDate < values.startDate)
    errors.endDate = "End date must be after start date.";

  if (values.selectedStations.length === 0)
    errors.stationIds = "Please select at least one branch.";

  if (values.targetIds.length === 0)
    errors.targetIds = "Please select at least one customer tier.";

  if (values.vouchers.length === 0)
    errors.vouchers = "Please add at least one voucher code.";

  const codes = values.vouchers.map((v) => v.voucherCode.trim().toUpperCase());

  values.vouchers.forEach((v, i) => {
    const p = `voucher_${i}`;

    if (!v.voucherCode.trim())
      errors[`${p}_code`] = "Voucher code cannot be empty.";
    else if (!/^[A-Z0-9]+$/.test(v.voucherCode.toUpperCase()))
      errors[`${p}_code`] = "Only uppercase letters and numbers allowed.";
    else if (v.voucherCode.length > 50)
      errors[`${p}_code`] = "Must not exceed 50 characters.";
    else if (codes.filter((c) => c === v.voucherCode.toUpperCase()).length > 1)
      errors[`${p}_code`] = "Duplicate voucher code detected.";

    if (!v.discountValue) errors[`${p}_discount`] = "This field is required.";
    else if (Number(v.discountValue) <= 0)
      errors[`${p}_discount`] = "Value must be a positive number.";
    else if (v.discountType === "PERCENTAGE" && Number(v.discountValue) > 100)
      errors[`${p}_discount`] = "Cannot exceed 100%.";

    if (!v.maxDiscountAmount)
      errors[`${p}_maxDiscount`] = "This field is required.";
    else if (Number(v.maxDiscountAmount) <= 0)
      errors[`${p}_maxDiscount`] = "Value must be a positive number.";

    if (!v.minOrderValue) errors[`${p}_minOrder`] = "This field is required.";
    else if (Number(v.minOrderValue) <= 0)
      errors[`${p}_minOrder`] = "Value must be a positive number.";
    else if (Number(v.minOrderValue) <= Number(v.maxDiscountAmount))
      errors[`${p}_minOrder`] = "Must be greater than max discount amount.";

    if (!v.usageLimit) errors[`${p}_limit`] = "This field is required.";
    else if (
      !Number.isInteger(Number(v.usageLimit)) ||
      Number(v.usageLimit) <= 0
    )
      errors[`${p}_limit`] = "Must be a positive integer.";
  });

  return errors;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromotionFormProps {
  mode: "create" | "edit";
  // Truyền vào khi edit để pre-fill form
  initialData?: PromotionItem;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: PromotionFormValues) => void;
  onCancel: () => void;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[1px] text-outline">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-outline">{hint}</span>}
      {error && (
        <span className="flex items-center gap-1 text-xs text-error">
          <AlertCircle className="size-3" />
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Station Multi-Picker (Grouped Chips) ────────────────────────────────────

interface StationGroup {
  provinceId: number;
  provinceName: string;
  stations: Station[];
}

function StationMultiPicker({
  selectedIds,
  onAdd,
  onRemove,
  error,
}: {
  selectedIds: number[];
  selectedStations: { id: number; name: string }[];
  onAdd: (s: { id: number; name: string }) => void;
  onRemove: (id: number) => void;
  error?: string;
}) {
  const [groups, setGroups] = useState<StationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load toàn bộ station 1 lần khi mount — gọi song song bằng Promise.all
  useEffect(() => {
    let isMounted = true;

    getProvinces()
      .then(async (provinces) => {
        // Lấy communes của tất cả province song song
        const communesList = await Promise.all(
          provinces.map((p) => getCommunesByProvince(p.id)),
        );

        // Lấy stations của tất cả commune song song
        const allCommunes = communesList.flat();
        const stationsList = await Promise.all(
          allCommunes.map((c) => getStationsByCommune(c.id)),
        );

        if (!isMounted) return;

        // Group stations theo province
        const grouped: StationGroup[] = provinces
          .map((province, pi) => {
            const communesOfProvince = communesList[pi];
            const communeIds = new Set(communesOfProvince.map((c) => c.id));

            // Tìm index của từng commune trong allCommunes để lấy đúng stations
            const provinceStations = allCommunes
              .map((c, ci) => ({ commune: c, stations: stationsList[ci] }))
              .filter(({ commune }) => communeIds.has(commune.id))
              .flatMap(({ stations }) => stations);

            return {
              provinceId: province.id,
              provinceName: province.provinceName,
              stations: provinceStations,
            };
          })
          .filter((g) => g.stations.length > 0);

        setGroups(grouped);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Tất cả station đang hoạt động
  const allOperating = groups.flatMap((g) =>
    g.stations.filter((s) => s.operating),
  );
  const isAllSelected =
    allOperating.length > 0 &&
    allOperating.every((s) => selectedIds.includes(s.id));

  function handleSelectAll() {
    if (isAllSelected) {
      // Clear all
      allOperating.forEach((s) => onRemove(s.id));
    } else {
      // Select all chưa được chọn
      allOperating
        .filter((s) => !selectedIds.includes(s.id))
        .forEach((s) => onAdd({ id: s.id, name: s.stationName }));
    }
  }

  function handleToggle(s: Station) {
    if (!s.operating) return;
    if (selectedIds.includes(s.id)) {
      onRemove(s.id);
    } else {
      onAdd({ id: s.id, name: s.stationName });
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-20 items-center justify-center rounded-[12px] border border-outline-variant/30 bg-surface-container-low/30">
        <span className="text-xs text-outline">Loading branches...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header + Select All */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">
          {selectedIds.length} selected
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {isAllSelected ? "Clear All" : "Select All"}
        </button>
      </div>

      {/* Grouped chips */}
      <div className="flex flex-col gap-4 rounded-[12px] border border-outline-variant/30 bg-surface-container-low/30 p-4">
        {groups.map((group) => (
          <div key={group.provinceId} className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              {group.provinceName}
            </span>
            <div className="flex flex-wrap gap-2">
              {group.stations.map((s) => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggle(s)}
                    disabled={!s.operating}
                    className={`rounded-[8px] border-2 px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-on-surface"
                    }`}
                  >
                    {s.stationName}
                    {!s.operating && " (Inactive)"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <span className="flex items-center gap-1 text-xs text-error">
          <AlertCircle className="size-3" />
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Voucher Row ──────────────────────────────────────────────────────────────

function VoucherRow({
  index,
  voucher,
  canRemove,
  errors,
  onChange,
  onRemove,
}: {
  index: number;
  voucher: VoucherFormItem;
  canRemove: boolean;
  errors: Record<string, string>;
  onChange: (
    field: keyof VoucherFormItem,
    value: string | boolean | number | null,
  ) => void;
  onRemove: () => void;
}) {
  const p = `voucher_${index}`;
  const inputClass =
    "rounded-[8px] border border-outline-variant/40 bg-white px-3 py-2 text-sm font-medium text-on-surface outline-none focus:border-primary placeholder:text-outline/50";
  const errorClass = "border-error focus:border-error";

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-outline-variant/30 bg-surface-container-low/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-outline">
          Voucher #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs font-medium text-error/70 hover:text-error"
          >
            <Trash2 className="size-3" />
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Voucher Code" error={errors[`${p}_code`]}>
          <input
            type="text"
            value={voucher.voucherCode}
            onChange={(e) =>
              onChange("voucherCode", e.target.value.toUpperCase())
            }
            placeholder="SUMMER2026"
            className={`${inputClass} uppercase ${errors[`${p}_code`] ? errorClass : ""}`}
          />
        </FormField>
        <FormField label="Usage Limit" error={errors[`${p}_limit`]}>
          <input
            type="number"
            min={1}
            value={voucher.usageLimit}
            onChange={(e) => onChange("usageLimit", e.target.value)}
            placeholder="200"
            className={`${inputClass} ${errors[`${p}_limit`] ? errorClass : ""}`}
          />
        </FormField>
      </div>

      {/* Discount Type toggle — FIXED (VNĐ) hoặc PERCENTAGE (%) */}
      <FormField label="Discount Type">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange("discountType", "PERCENTAGE")}
            className={`flex-1 rounded-[8px] border-2 py-2 text-sm font-semibold transition-colors ${
              voucher.discountType === "PERCENTAGE"
                ? "border-primary bg-primary/5 text-primary"
                : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
            }`}
          >
            Percentage (%)
          </button>
          <button
            type="button"
            onClick={() => {
              onChange("discountType", "FIXED");
              // Chuyển sang FIXED → maxDiscountAmount sync ngay theo discountValue hiện có
              onChange("maxDiscountAmount", voucher.discountValue);
            }}
            className={`flex-1 rounded-[8px] border-2 py-2 text-sm font-semibold transition-colors ${
              voucher.discountType === "FIXED"
                ? "border-primary bg-primary/5 text-primary"
                : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
            }`}
          >
            Fixed Amount (VNĐ)
          </button>
        </div>
      </FormField>

      <div
        className={`grid gap-3 ${voucher.discountType === "FIXED" ? "grid-cols-2" : "grid-cols-3"}`}
      >
        <FormField
          label={
            voucher.discountType === "PERCENTAGE"
              ? "Discount (%)"
              : "Discount Amount (VNĐ)"
          }
          error={errors[`${p}_discount`]}
        >
          <input
            type="number"
            min={1}
            max={voucher.discountType === "PERCENTAGE" ? 100 : undefined}
            value={voucher.discountValue}
            onChange={(e) => {
              const val = e.target.value;
              onChange("discountValue", val);
              // FIXED: discount amount == max discount amount, chỉ cần nhập 1 lần
              if (voucher.discountType === "FIXED") {
                onChange("maxDiscountAmount", val);
              }
            }}
            placeholder={voucher.discountType === "PERCENTAGE" ? "15" : "30000"}
            className={`${inputClass} ${errors[`${p}_discount`] ? errorClass : ""}`}
          />
        </FormField>
        {/* Max Discount chỉ hiện ở PERCENTAGE — FIXED thì bằng chính discountValue */}
        {voucher.discountType === "PERCENTAGE" && (
          <FormField
            label="Max Discount (VNĐ)"
            error={errors[`${p}_maxDiscount`]}
          >
            <input
              type="number"
              min={0}
              value={voucher.maxDiscountAmount}
              onChange={(e) => onChange("maxDiscountAmount", e.target.value)}
              placeholder="50000"
              className={`${inputClass} ${errors[`${p}_maxDiscount`] ? errorClass : ""}`}
            />
          </FormField>
        )}
        <FormField label="Min Order (VNĐ)" error={errors[`${p}_minOrder`]}>
          <input
            type="number"
            min={0}
            value={voucher.minOrderValue}
            onChange={(e) => onChange("minOrderValue", e.target.value)}
            placeholder="100000"
            className={`${inputClass} ${errors[`${p}_minOrder`] ? errorClass : ""}`}
          />
        </FormField>
      </div>

      {/* Reusable toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange("reusable", !voucher.reusable)}
          className={`relative h-6 w-11 rounded-full transition-colors ${voucher.reusable ? "bg-primary" : "bg-outline-variant"}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${voucher.reusable ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
        <span className="text-sm font-medium text-on-surface">
          Allow reuse per customer
        </span>
      </div>
    </div>
  );
}

// ─── Main Form Component ──────────────────────────────────────────────────────

export default function PromotionForm({
  mode,
  initialData,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: PromotionFormProps) {
  const inputClass =
    "rounded-[8px] border border-outline-variant/40 bg-white px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary placeholder:text-outline/50";
  const errorClass = "border-error focus:border-error";

  // Pre-fill từ initialData khi edit, rỗng khi create
  const [campaignName, setCampaignName] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
  const [selectedStations, setSelectedStations] = useState<
    { id: number; name: string }[]
  >(
    initialData?.stations.map((s) => ({
      id: s.stationId,
      name: s.stationName,
    })) ?? [],
  );
  const [targetIds, setTargetIds] = useState<number[]>(
    initialData?.targets.map((t) => t.targetId) ?? [],
  );
  const [vouchers, setVouchers] = useState<VoucherFormItem[]>(
    initialData?.vouchers.map((v) => ({
      key: String(v.id),
      id: v.id,
      voucherCode: v.voucherCode,
      discountType: v.discountType,
      discountValue: String(v.discountValue),
      maxDiscountAmount: String(v.maxDiscountAmount),
      minOrderValue: String(v.minOrderValue),
      usageLimit: v.usageLimit,
      reusable: v.reusable,
    })) ?? [
      {
        key: crypto.randomUUID(),
        id: null,
        voucherCode: "",
        discountType: "PERCENTAGE" as DiscountType,
        discountValue: "",
        maxDiscountAmount: "",
        minOrderValue: "",
        usageLimit: "",
        reusable: false,
      },
    ],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function addVoucher() {
    setVouchers((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        id: null,
        voucherCode: "",
        discountType: "PERCENTAGE" as DiscountType,
        discountValue: "",
        maxDiscountAmount: "",
        minOrderValue: "",
        usageLimit: "",
        reusable: false,
      },
    ]);
  }

  function removeVoucher(key: string) {
    setVouchers((prev) => prev.filter((v) => v.key !== key));
  }

  function updateVoucher(
    key: string,
    field: keyof VoucherFormItem,
    value: string | boolean | number | null,
  ) {
    setVouchers((prev) =>
      prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)),
    );
  }

  function toggleTier(id: number) {
    setTargetIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleSubmit() {
    const values: PromotionFormValues = {
      campaignName,
      description,
      startDate,
      endDate,
      selectedStations,
      targetIds,
      vouchers,
    };

    const validationErrors = validatePromotionForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onSubmit(values);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section 1: Campaign Info ── */}
      <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <h2 className="mb-4 font-heading text-base font-semibold text-on-surface">
          1. Campaign Information
        </h2>
        <div className="flex flex-col gap-4">
          <FormField label="Campaign Name" error={errors.campaignName}>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Summer Promo 2026"
              className={`${inputClass} ${errors.campaignName ? errorClass : ""}`}
            />
          </FormField>

          <FormField label="Description" error={errors.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this campaign (optional)"
              rows={3}
              className={`${inputClass} resize-none ${errors.description ? errorClass : ""}`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" error={errors.startDate}>
              <input
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputClass} ${errors.startDate ? errorClass : ""}`}
              />
            </FormField>
            <FormField
              label="End Date"
              error={errors.endDate}
              hint="Voucher expiry dates will follow campaign dates."
            >
              <input
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} ${errors.endDate ? errorClass : ""}`}
              />
            </FormField>
          </div>

          <FormField label="Applied Branches" error={errors.stationIds}>
            <StationMultiPicker
              selectedIds={selectedStations.map((s) => s.id)}
              selectedStations={selectedStations}
              onAdd={(s) => setSelectedStations((prev) => [...prev, s])}
              onRemove={(id) =>
                setSelectedStations((prev) => prev.filter((s) => s.id !== id))
              }
              error={errors.stationIds}
            />
          </FormField>
        </div>
      </div>

      {/* ── Section 2: Vouchers ── */}
      <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-on-surface">
            2. Voucher Codes
          </h2>
          <button
            type="button"
            onClick={addVoucher}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
          >
            <Plus className="size-3.5" />
            Add Voucher
          </button>
        </div>

        {errors.vouchers && (
          <span className="mb-3 flex items-center gap-1 text-xs text-error">
            <AlertCircle className="size-3" />
            {errors.vouchers}
          </span>
        )}

        <div className="flex flex-col gap-3">
          {vouchers.map((v, i) => (
            <VoucherRow
              key={v.key}
              index={i}
              voucher={v}
              canRemove={vouchers.length > 1}
              errors={errors}
              onChange={(field, value) => updateVoucher(v.key, field, value)}
              onRemove={() => removeVoucher(v.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Section 3: Target Tiers ── */}
      <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <h2 className="mb-1 font-heading text-base font-semibold text-on-surface">
          3. Target Customer Tiers
        </h2>
        <div className="mt-4 flex gap-3">
          {CUSTOMER_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => toggleTier(tier.id)}
              className={`rounded-[8px] border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                targetIds.includes(tier.id)
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
              }`}
            >
              {tier.name}
            </button>
          ))}
        </div>
        {errors.targetIds && (
          <span className="mt-3 flex items-center gap-1 text-xs text-error">
            <AlertCircle className="size-3" />
            {errors.targetIds}
          </span>
        )}
      </div>

      {/* ── Submit ── */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-[8px] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <AlertCircle className="size-4 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border border-outline-variant/30 px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-[8px] bg-primary px-8 py-3 text-sm font-bold text-white shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.2)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Confirm & Create"
              : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

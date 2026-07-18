import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Plus, Trash2, X } from "lucide-react";
import {
  getProvinces,
  getCommunesByProvince,
} from "../../station/api/addressApi";
import { getStationsByCommune } from "../../station/api/stationApi";
import type { Province, Commune } from "../../station/types/address";
import type { Station } from "../../station/types/station";
import type {
  PromotionItem,
  VoucherFormItem,
  PromotionFormValues,
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

const today = new Date().toISOString().split("T")[0];

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

    if (!v.discountPercentage)
      errors[`${p}_discount`] = "This field is required.";
    else if (Number(v.discountPercentage) <= 0)
      errors[`${p}_discount`] = "Value must be a positive number.";
    else if (Number(v.discountPercentage) > 100)
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

function StationTag({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1">
      <span className="text-xs font-semibold text-primary">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-primary/60 hover:text-primary"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

// ─── Station Multi-Picker ─────────────────────────────────────────────────────

function StationMultiPicker({
  selectedIds,
  selectedStations,
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
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [provinceId, setProvinceId] = useState<number | "">("");
  const [communeId, setCommuneId] = useState<number | "">("");

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provinceId) return;
    getCommunesByProvince(Number(provinceId))
      .then(setCommunes)
      .catch(() => {});
  }, [provinceId]);

  useEffect(() => {
    if (!communeId) return;
    getStationsByCommune(Number(communeId))
      .then(setStations)
      .catch(() => {});
  }, [communeId]);

  function handleProvinceChange(val: number | "") {
    setProvinceId(val);
    setCommuneId("");
    setCommunes([]);
    setStations([]);
  }

  function handleCommuneChange(val: number | "") {
    setCommuneId(val);
    setStations([]);
  }

  const selectClass =
    "rounded-[8px] border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface outline-none focus:border-primary";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <select
          value={provinceId}
          onChange={(e) =>
            handleProvinceChange(e.target.value ? Number(e.target.value) : "")
          }
          className={selectClass}
        >
          <option value="">Select Province</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.provinceName}
            </option>
          ))}
        </select>
        <select
          value={communeId}
          onChange={(e) =>
            handleCommuneChange(e.target.value ? Number(e.target.value) : "")
          }
          disabled={!provinceId}
          className={`${selectClass} disabled:opacity-40`}
        >
          <option value="">Select Commune</option>
          {communes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.communeName}
            </option>
          ))}
        </select>
        <select
          value=""
          onChange={(e) => {
            const s = stations.find((st) => st.id === Number(e.target.value));
            if (s && !selectedIds.includes(s.id))
              onAdd({ id: s.id, name: s.stationName });
          }}
          disabled={!communeId || stations.length === 0}
          className={`${selectClass} disabled:opacity-40`}
        >
          <option value="">Add Station</option>
          {stations.map((s) => (
            <option
              key={s.id}
              value={s.id}
              disabled={selectedIds.includes(s.id) || !s.operating}
            >
              {s.stationName}
              {!s.operating ? " (Inactive)" : ""}
              {selectedIds.includes(s.id) ? " ✓" : ""}
            </option>
          ))}
        </select>
      </div>
      {selectedStations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedStations.map((s) => (
            <StationTag
              key={s.id}
              name={s.name}
              onRemove={() => onRemove(s.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-10 items-center rounded-[8px] border border-dashed border-outline-variant/40 px-3">
          <span className="text-xs text-outline">No branches selected yet</span>
        </div>
      )}
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

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Discount (%)" error={errors[`${p}_discount`]}>
          <input
            type="number"
            min={1}
            max={100}
            value={voucher.discountPercentage}
            onChange={(e) => onChange("discountPercentage", e.target.value)}
            placeholder="15"
            className={`${inputClass} ${errors[`${p}_discount`] ? errorClass : ""}`}
          />
        </FormField>
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
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${voucher.reusable ? "translate-x-5" : "translate-x-0.5"}`}
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
      discountPercentage: String(v.discountPercentage),
      maxDiscountAmount: String(v.maxDiscountAmount),
      minOrderValue: String(v.minOrderValue),
      usageLimit: v.usageLimit,
      reusable: v.reusable,
    })) ?? [
      {
        key: crypto.randomUUID(),
        id: null,
        voucherCode: "",
        discountPercentage: "",
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
        discountPercentage: "",
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
          <span className="ml-2 text-xs font-normal text-outline">
            (Optional — leave empty for all customers)
          </span>
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

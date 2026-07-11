import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, AlertCircle } from "lucide-react";
import { createPromotion } from "../api/promotionApi";
import {
  getProvinces,
  getCommunesByProvince,
} from "../../station/api/addressApi";
import { getStationsByCommune } from "../../station/api/stationApi";
import type { Province, Commune } from "../../station/types/address";
import type { Station } from "../../station/types/station";
import type {
  ConfigMode,
  DiscountType,
  CreatePromotionRequest,
} from "../types/promotion";
import Modal from "../../../components/ui/Modal";

// ─── Constants ───────────────────────────────────────────────────────────────

// Mock customer tiers — thay bằng API khi BE có endpoint riêng
const CUSTOMER_TIERS = [
  { id: 1, name: "Member" },
  { id: 2, name: "Silver" },
  { id: 3, name: "Gold" },
  { id: 4, name: "Platinum" },
];

const today = new Date().toISOString().split("T")[0]; // "2026-07-09"

// ─── Sub-components ──────────────────────────────────────────────────────────

// Card chọn configMode
function ModeCard({
  mode,
  selected,
  title,
  description,
  onClick,
}: {
  mode: ConfigMode;
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col gap-2 rounded-[16px] border-2 p-6 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.15)]"
          : "border-outline-variant/30 bg-white hover:border-primary/30"
      }`}
    >
      <div
        className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
          selected
            ? "bg-primary text-white"
            : "bg-surface-container-high text-outline"
        }`}
      >
        {mode}
      </div>
      <span
        className={`font-heading text-base font-semibold ${selected ? "text-primary" : "text-on-surface"}`}
      >
        {title}
      </span>
      <span className="text-xs text-on-surface-variant">{description}</span>
    </button>
  );
}

// Tag station đã chọn
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

// Label + input wrapper
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[1px] text-outline">
        {label}
      </label>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-xs text-error">
          <AlertCircle className="size-3" />
          {error}
        </span>
      )}
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
  onAdd: (station: { id: number; name: string }) => void;
  onRemove: (id: number) => void;
  error?: string;
}) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [provinceId, setProvinceId] = useState<number | "">("");
  const [communeId, setCommuneId] = useState<number | "">("");

  // Load provinces 1 lần khi mount
  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => {});
  }, []);

  // Load communes khi provinceId thay đổi — chỉ gọi API, không reset trong effect
  useEffect(() => {
    if (!provinceId) return;
    getCommunesByProvince(Number(provinceId))
      .then(setCommunes)
      .catch(() => {});
  }, [provinceId]);

  // Load stations khi communeId thay đổi — chỉ gọi API, không reset trong effect
  useEffect(() => {
    if (!communeId) return;
    getStationsByCommune(Number(communeId))
      .then(setStations)
      .catch(() => {});
  }, [communeId]);

  // Reset cascade trong handler thay vì trong effect để tránh lỗi cascading setState
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
      {/* Cascade selectors */}
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
            if (s && !selectedIds.includes(s.id)) {
              onAdd({ id: s.id, name: s.stationName });
            }
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

      {/* Tags các station đã chọn */}
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

// ─── Form State & Validation ──────────────────────────────────────────────────

interface FormState {
  configMode: ConfigMode;
  campaignName: string;
  campaignStartDate: string;
  campaignEndDate: string;
  voucherCode: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderValue: string;
  usageLimit: string;
  voucherStartDate: string;
  voucherEndDate: string;
  targetCustomerTierIds: number[];
  // Station picker state
  selectedStations: { id: number; name: string }[];
}

const initialForm: FormState = {
  configMode: 1,
  campaignName: "",
  campaignStartDate: "",
  campaignEndDate: "",
  voucherCode: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderValue: "",
  usageLimit: "",
  voucherStartDate: "",
  voucherEndDate: "",
  targetCustomerTierIds: [],
  selectedStations: [],
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const mode = form.configMode;

  // Mode 1 & 2: campaign fields bắt buộc
  if (mode === 1 || mode === 2) {
    if (!form.campaignName.trim())
      errors.campaignName = "Campaign name is required.";
    if (!form.campaignStartDate)
      errors.campaignStartDate = "Start date is required.";
    if (!form.campaignEndDate) errors.campaignEndDate = "End date is required.";
    if (form.selectedStations.length === 0)
      errors.stationIds = "Please select at least one branch.";
    if (form.targetCustomerTierIds.length === 0)
      errors.targetCustomerTierIds = "Please select at least one tier.";
  }

  // Mode 2 & 3: voucher fields bắt buộc
  if (mode === 2 || mode === 3) {
    if (!form.voucherCode.trim())
      errors.voucherCode = "Voucher code is required.";
    if (!form.usageLimit) errors.usageLimit = "Usage limit is required.";
  }

  // Mode 3: voucher dates bắt buộc
  if (mode === 3) {
    if (!form.voucherStartDate)
      errors.voucherStartDate = "Voucher start date is required.";
    if (!form.voucherEndDate)
      errors.voucherEndDate = "Voucher end date is required.";
  }

  // Tất cả mode: discount fields
  if (!form.discountValue) errors.discountValue = "Discount value is required.";
  if (!form.maxDiscountAmount)
    errors.maxDiscountAmount = "Max discount amount is required.";
  if (!form.minOrderValue)
    errors.minOrderValue = "Min order value is required.";

  // Validate ngày: không chọn quá khứ, end >= start
  const validateDatePair = (
    start: string,
    end: string,
    startKey: string,
    endKey: string,
  ) => {
    if (start && start < today)
      errors[startKey] = "Date cannot be in the past.";
    if (end && end < today) errors[endKey] = "Date cannot be in the past.";
    if (start && end && end < start)
      errors[endKey] = "End date must be after start date.";
  };

  if (mode === 1 || mode === 2)
    validateDatePair(
      form.campaignStartDate,
      form.campaignEndDate,
      "campaignStartDate",
      "campaignEndDate",
    );
  if (mode === 3)
    validateDatePair(
      form.voucherStartDate,
      form.voucherEndDate,
      "voucherStartDate",
      "voucherEndDate",
    );

  return errors;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper cập nhật 1 field
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Đổi mode → reset toàn bộ form, giữ lại discountType
  function handleModeChange(mode: ConfigMode) {
    setForm({ ...initialForm, configMode: mode });
    setErrors({});
    setSubmitError(null);
  }

  // Toggle tier selection
  function toggleTier(id: number) {
    set(
      "targetCustomerTierIds",
      form.targetCustomerTierIds.includes(id)
        ? form.targetCustomerTierIds.filter((t) => t !== id)
        : [...form.targetCustomerTierIds, id],
    );
  }

  function handleSubmit() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Build request object theo đúng configMode
    const body: CreatePromotionRequest = {
      configMode: form.configMode,
      campaignName: form.configMode !== 3 ? form.campaignName : null,
      campaignStartDate: form.configMode !== 3 ? form.campaignStartDate : null,
      campaignEndDate: form.configMode !== 3 ? form.campaignEndDate : null,
      stationIds:
        form.configMode !== 3 ? form.selectedStations.map((s) => s.id) : null,
      voucherCode:
        form.configMode !== 1 ? form.voucherCode.toUpperCase() : null,
      usageLimit: form.configMode !== 1 ? Number(form.usageLimit) : null,
      reusable: form.configMode !== 1 ? true : null,
      voucherStartDate: form.configMode === 3 ? form.voucherStartDate : null,
      voucherEndDate: form.configMode === 3 ? form.voucherEndDate : null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: Number(form.maxDiscountAmount),
      minOrderValue: Number(form.minOrderValue),
      targetCustomerTierIds:
        form.targetCustomerTierIds.length > 0
          ? form.targetCustomerTierIds
          : null,
    };

    createPromotion(body)
      .then(() => {
        const name =
          form.configMode === 3 ? form.voucherCode : form.campaignName;
        navigate("/admin/promotions", {
          state: {
            successMessage: `Promotion "${name}" created successfully!`,
          },
        });
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ??
          "Failed to create promotion. Please try again.";
        setSubmitError(msg);
      })
      .finally(() => setIsSubmitting(false));
  }

  const inputClass =
    "rounded-[8px] border border-outline-variant/40 bg-white px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary placeholder:text-outline/50";
  const errorInputClass = "border-error focus:border-error";

  const mode = form.configMode;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Create Promotion
          </h1>
          <p className="text-sm text-on-surface-variant">
            Set up a new campaign or standalone voucher for your branches.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Step 1: Chọn configMode ── */}
        <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
          <h2 className="mb-4 font-heading text-base font-semibold text-on-surface">
            1. Select Promotion Type
          </h2>
          <div className="flex gap-4">
            <ModeCard
              mode={1}
              selected={mode === 1}
              title="Campaign Only"
              description="System-level discount campaign. No voucher code issued."
              onClick={() => handleModeChange(1)}
            />
            <ModeCard
              mode={2}
              selected={mode === 2}
              title="Campaign + Voucher"
              description="Large campaign with a voucher code customers can enter."
              onClick={() => handleModeChange(2)}
            />
            <ModeCard
              mode={3}
              selected={mode === 3}
              title="Standalone Voucher"
              description="Independent voucher code. Applies system-wide to all branches."
              onClick={() => handleModeChange(3)}
            />
          </div>
        </div>

        {/* ── Step 2: Campaign Info (Mode 1 & 2) ── */}
        {(mode === 1 || mode === 2) && (
          <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <h2 className="mb-4 font-heading text-base font-semibold text-on-surface">
              2. Campaign Information
            </h2>
            <div className="flex flex-col gap-4">
              <FormField
                label="Campaign Name"
                required
                error={errors.campaignName}
              >
                <input
                  type="text"
                  value={form.campaignName}
                  onChange={(e) => set("campaignName", e.target.value)}
                  placeholder="Summer Promo 2026"
                  className={`${inputClass} ${errors.campaignName ? errorInputClass : ""}`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Campaign Start Date"
                  required
                  error={errors.campaignStartDate}
                >
                  <input
                    type="date"
                    min={today}
                    value={form.campaignStartDate}
                    onChange={(e) => set("campaignStartDate", e.target.value)}
                    className={`${inputClass} ${errors.campaignStartDate ? errorInputClass : ""}`}
                  />
                </FormField>
                <FormField
                  label="Campaign End Date"
                  required
                  error={errors.campaignEndDate}
                >
                  <input
                    type="date"
                    min={form.campaignStartDate || today}
                    value={form.campaignEndDate}
                    onChange={(e) => set("campaignEndDate", e.target.value)}
                    className={`${inputClass} ${errors.campaignEndDate ? errorInputClass : ""}`}
                  />
                </FormField>
              </div>

              {/* Station multi-picker */}
              <FormField label="Applied Branches" required>
                <StationMultiPicker
                  selectedIds={form.selectedStations.map((s) => s.id)}
                  selectedStations={form.selectedStations}
                  onAdd={(s) =>
                    set("selectedStations", [...form.selectedStations, s])
                  }
                  onRemove={(id) =>
                    set(
                      "selectedStations",
                      form.selectedStations.filter((s) => s.id !== id),
                    )
                  }
                  error={errors.stationIds}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ── Step 3: Voucher Info (Mode 2 & 3) ── */}
        {(mode === 2 || mode === 3) && (
          <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <h2 className="mb-4 font-heading text-base font-semibold text-on-surface">
              {mode === 2
                ? "3. Voucher Configuration"
                : "2. Voucher Configuration"}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Voucher Code"
                  required
                  error={errors.voucherCode}
                >
                  <input
                    type="text"
                    value={form.voucherCode}
                    onChange={(e) =>
                      set("voucherCode", e.target.value.toUpperCase())
                    }
                    placeholder="SUMMER2026"
                    className={`${inputClass} uppercase ${errors.voucherCode ? errorInputClass : ""}`}
                  />
                </FormField>

                <FormField
                  label="Usage Limit"
                  required
                  error={errors.usageLimit}
                >
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit}
                    onChange={(e) => set("usageLimit", e.target.value)}
                    placeholder="200"
                    className={`${inputClass} ${errors.usageLimit ? errorInputClass : ""}`}
                  />
                </FormField>
              </div>

              {/* Voucher dates chỉ hiện ở mode 3 */}
              {mode === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Voucher Start Date"
                    required
                    error={errors.voucherStartDate}
                  >
                    <input
                      type="date"
                      min={today}
                      value={form.voucherStartDate}
                      onChange={(e) => set("voucherStartDate", e.target.value)}
                      className={`${inputClass} ${errors.voucherStartDate ? errorInputClass : ""}`}
                    />
                  </FormField>
                  <FormField
                    label="Voucher End Date"
                    required
                    error={errors.voucherEndDate}
                  >
                    <input
                      type="date"
                      min={form.voucherStartDate || today}
                      value={form.voucherEndDate}
                      onChange={(e) => set("voucherEndDate", e.target.value)}
                      className={`${inputClass} ${errors.voucherEndDate ? errorInputClass : ""}`}
                    />
                  </FormField>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Discount Rules (tất cả mode) ── */}
        <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
          <h2 className="mb-4 font-heading text-base font-semibold text-on-surface">
            {mode === 1 ? "3." : mode === 2 ? "4." : "3."} Discount Rules
          </h2>
          <div className="flex flex-col gap-4">
            {/* Discount Type */}
            <FormField label="Discount Type" required>
              <div className="flex gap-3">
                {(["PERCENTAGE", "FIXED"] as DiscountType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        discountType: type,
                        maxDiscountAmount:
                          type === "FIXED"
                            ? prev.discountValue
                            : prev.maxDiscountAmount,
                      }))
                    }
                    className={`flex-1 rounded-[8px] border-2 py-2.5 text-sm font-semibold transition-colors ${
                      form.discountType === type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                    }`}
                  >
                    {type === "PERCENTAGE"
                      ? "Percentage (%)"
                      : "Fixed Amount (VND)"}
                  </button>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                label={
                  form.discountType === "PERCENTAGE"
                    ? "Discount (%)"
                    : "Discount (VND)"
                }
                required
                error={errors.discountValue}
              >
                <input
                  type="number"
                  min={0}
                  max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      discountValue: value,
                      maxDiscountAmount:
                        prev.discountType === "FIXED"
                          ? value
                          : prev.maxDiscountAmount,
                    }));
                  }}
                  placeholder={
                    form.discountType === "PERCENTAGE" ? "15" : "30000"
                  }
                  className={`${inputClass} ${errors.discountValue ? errorInputClass : ""}`}
                />
              </FormField>

              <FormField
                label="Max Discount (VND)"
                required
                error={errors.maxDiscountAmount}
              >
                <input
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount}
                  onChange={(e) => set("maxDiscountAmount", e.target.value)}
                  placeholder="50000"
                  readOnly={form.discountType === "FIXED"}
                  className={`${inputClass} ${errors.maxDiscountAmount ? errorInputClass : ""} ${
                    form.discountType === "FIXED"
                      ? "cursor-not-allowed bg-surface-container-low"
                      : ""
                  }`}
                />
              </FormField>

              <FormField
                label="Min Order Value (VND)"
                required
                error={errors.minOrderValue}
              >
                <input
                  type="number"
                  min={0}
                  value={form.minOrderValue}
                  onChange={(e) => set("minOrderValue", e.target.value)}
                  placeholder="100000"
                  className={`${inputClass} ${errors.minOrderValue ? errorInputClass : ""}`}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* ── Target Customer Tiers (chỉ mode 1 & 2 — mode 3 áp dụng toàn hệ thống) ── */}
        {(mode === 1 || mode === 2) && (
          <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <h2 className="mb-1 font-heading text-base font-semibold text-on-surface">
              {mode === 1 ? "4." : "5."} Target Customer Tiers
            </h2>
            <div className="mt-4 flex gap-3">
              {CUSTOMER_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => toggleTier(tier.id)}
                  className={`flex items-center gap-2 rounded-[8px] border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    form.targetCustomerTierIds.includes(tier.id)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                  }`}
                >
                  {form.targetCustomerTierIds.includes(tier.id) && (
                    <Plus className="size-3.5 rotate-45" />
                  )}
                  {tier.name}
                </button>
              ))}
            </div>
            {errors.targetCustomerTierIds && (
              <span className="mt-2 flex items-center gap-1 text-xs text-error">
                <AlertCircle className="size-3" />
                {errors.targetCustomerTierIds}
              </span>
            )}
          </div>
        )}

        {/* ── Submit ── */}

        <Modal
          isOpen={!!submitError}
          onClose={() => setSubmitError(null)}
          variant="danger"
          title="Unable to Create Promotion"
          message={submitError ?? ""}
          confirmText="Got it"
          onConfirm={() => setSubmitError(null)}
        />

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/promotions")}
            className="rounded-[8px] border border-outline-variant/30 px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-[8px] bg-primary px-8 py-3 text-sm font-bold text-white shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.2)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Confirm & Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

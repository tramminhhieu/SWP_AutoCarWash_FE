import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, AlertCircle, Lock } from "lucide-react";
import { updateCampaign, updateVoucher } from "../api/promotionApi";
import {
  getProvinces,
  getCommunesByProvince,
} from "../../station/api/addressApi";
import { getStationsByCommune } from "../../station/api/stationApi";
import type { Province, Commune } from "../../station/types/address";
import type { Station } from "../../station/types/station";
import type {
  PromotionEditNavState,
  UpdateCampaignRequest,
  UpdateVoucherRequest,
  DiscountType,
} from "../types/promotion";
import Modal from "../../../components/ui/Modal";

// ─── Constants ───────────────────────────────────────────────────────────────

const CUSTOMER_TIERS = [
  { id: 1, name: "Member" },
  { id: 2, name: "Silver" },
  { id: 3, name: "Gold" },
  { id: 4, name: "Platinum" },
];

const today = new Date().toISOString().split("T")[0];

// Prefix đặc biệt của hệ thống — khóa toàn bộ voucher financial fields
const AUTO_PROMO_PREFIX = "AUTO_PROMO_";

// ─── Sub-components ──────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
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
        ✕
      </button>
    </div>
  );
}

// ─── Station Multi-Picker (tái sử dụng từ PromotionCreate) ──────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PromotionEditNavState | null;

  // Thay vì useState("") rồi useEffect set lại
  // → khởi tạo thẳng giá trị từ state luôn

  const [title, setTitle] = useState(state?.currentName ?? "");
  const [startDate, setStartDate] = useState(state?.currentStartDate ?? "");
  const [endDate, setEndDate] = useState(state?.currentEndDate ?? "");
  const [vCode, setVCode] = useState(state?.voucherCode ?? "");
  const [vStartDate, setVStartDate] = useState(state?.currentStartDate ?? "");
  const [vEndDate, setVEndDate] = useState(state?.currentEndDate ?? "");

  // Các state còn lại giữ nguyên
  const [description, setDescription] = useState("");
  const [selectedStations, setSelectedStations] = useState<
    { id: number; name: string }[]
  >([]);
  const [tierIds, setTierIds] = useState<number[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [reusable, setReusable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Guard: sau tất cả hooks mới được early return
  if (!state) {
    navigate("/admin/promotions");
    return null;
  }

  const {
    configMode,
    promotionId,
    voucherId,
    voucherCode,
    stationName,
    stationId,
    currentName,
  } = state;

  // Voucher code bắt đầu bằng AUTO_PROMO_ → khóa toàn bộ phần voucher
  const isAutoPromo = (voucherCode ?? "").startsWith(AUTO_PROMO_PREFIX);

  function toggleTier(id: number) {
    setTierIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (configMode === 1 || configMode === 2) {
      if (!title.trim()) errs.title = "Campaign name is required.";
      if (!startDate) errs.startDate = "Start date is required.";
      if (!endDate) errs.endDate = "End date is required.";
      if (startDate && startDate < today)
        errs.startDate = "Date cannot be in the past.";
      if (endDate && endDate < startDate)
        errs.endDate = "End date must be after start date.";
      if (selectedStations.length === 0)
        errs.stationIds = "Please select at least one branch.";
    }

    if ((configMode === 2 || configMode === 3) && !isAutoPromo) {
      if (!vCode.trim()) errs.vCode = "Voucher code is required.";
      if (!discountValue) errs.discountValue = "Discount value is required.";
      if (!maxDiscount) errs.maxDiscount = "Max discount is required.";
      if (!minOrder) errs.minOrder = "Min order value is required.";
      if (!usageLimit) errs.usageLimit = "Usage limit is required.";
      if (configMode === 3) {
        if (!vStartDate) errs.vStartDate = "Start date is required.";
        if (!vEndDate) errs.vEndDate = "End date is required.";
        if (vStartDate && vEndDate && vEndDate < vStartDate)
          errs.vEndDate = "End date must be after start date.";
      }
    }

    return errs;
  }

  async function handleSaveAll() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const promises: Promise<void>[] = [];

      // API-03-01: cập nhật campaign (mode 1 & 2)
      if ((configMode === 1 || configMode === 2) && promotionId) {
        const campaignBody: UpdateCampaignRequest = {
          title,
          description,
          startDate: startDate,
          endDate: endDate,
          stationIds: selectedStations.map((s) => s.id),
          targetCustomerTierIds: tierIds,
        };

        promises.push(updateCampaign(promotionId, campaignBody));
      }

      // API-03-02: cập nhật voucher rules (mode 2 & 3, không phải AUTO_PROMO_)
      if ((configMode === 2 || configMode === 3) && voucherId && !isAutoPromo) {
        // Mode 1 & 2: ngày voucher follow campaign (dùng campaign dates)
        // Mode 3: dùng ngày voucher riêng
        const voucherBody: UpdateVoucherRequest = {
          voucherCode: vCode.toUpperCase(),
          discountType,
          discountPercentage: Number(discountValue),
          maxDiscountAmount: Number(maxDiscount),
          minOrderValue: Number(minOrder),
          usageLimit: Number(usageLimit),
          startDate:
            configMode === 3
              ? `${vStartDate}T00:00:00`
              : `${startDate}T00:00:00`,
          expiryDate:
            configMode === 3 ? `${vEndDate}T23:59:59` : `${endDate}T23:59:59`,
          reusable,
        };

        promises.push(updateVoucher(voucherId, voucherBody));
      }

      // Gọi song song cả 2 API
      await Promise.all(promises);
      navigate(`/admin/promotions/station/${stationId}`, {
        state: { stationName, successMessage: "Changes saved successfully!" },
      });
      return;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save changes. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "rounded-[8px] border border-outline-variant/40 bg-white px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary placeholder:text-outline/50";
  const errorClass = "border-error focus:border-error";
  const lockedClass = "cursor-not-allowed bg-surface-container-high opacity-60";

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Edit Promotion
          </h1>
          <p className="text-sm text-on-surface-variant">{currentName}</p>
        </div>
        <button
          onClick={() =>
            navigate(`/admin/promotions/station/${stationId}`, {
              state: { stationName },
            })
          }
          className="flex items-center gap-2 rounded-[8px] border border-outline-variant/30 bg-white px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Section 1: Campaign Info (mode 1 & 2) ── */}
        {(configMode === 1 || configMode === 2) && (
          <div className="rounded-[16px] border border-outline-variant/30 bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)]">
            <h2 className="mb-4 font-heading text-base font-semibold text-on-surface">
              Campaign Information
            </h2>
            <div className="flex flex-col gap-4">
              <FormField label="Campaign Name" required error={errors.title}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${inputClass} ${errors.title ? errorClass : ""}`}
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" required error={errors.startDate}>
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
                  required
                  error={errors.endDate}
                  hint={
                    configMode === 2
                      ? "Voucher dates will automatically follow campaign dates."
                      : undefined
                  }
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

              <FormField label="Applied Branches" required>
                <StationMultiPicker
                  selectedIds={selectedStations.map((s) => s.id)}
                  selectedStations={selectedStations}
                  onAdd={(s) => setSelectedStations((prev) => [...prev, s])}
                  onRemove={(id) =>
                    setSelectedStations((prev) =>
                      prev.filter((s) => s.id !== id),
                    )
                  }
                  error={errors.stationIds}
                />
              </FormField>

              <FormField label="Target Customer Tiers">
                <div className="flex gap-3">
                  {CUSTOMER_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => toggleTier(tier.id)}
                      className={`rounded-[8px] border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                        tierIds.includes(tier.id)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                      }`}
                    >
                      {tier.name}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </div>
        )}

        {/* ── Section 2: Voucher Rules (mode 2 & 3) ── */}
        {(configMode === 2 || configMode === 3) && (
          <div
            className={`rounded-[16px] border bg-white p-6 shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.05)] ${isAutoPromo ? "border-warning/30" : "border-outline-variant/30"}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-on-surface">
                Voucher Financial Rules
              </h2>
              {/* Warning nếu AUTO_PROMO_ */}
              {isAutoPromo && (
                <div className="flex items-center gap-2 rounded-[8px] border border-warning/30 bg-warning/5 px-3 py-2">
                  <Lock className="size-3.5 text-warning" />
                  <span className="text-xs font-semibold text-warning">
                    System-wide discount code — financial rules cannot be edited
                    here.
                  </span>
                </div>
              )}
            </div>

            <div
              className={`flex flex-col gap-4 ${isAutoPromo ? "pointer-events-none opacity-50 select-none" : ""}`}
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Voucher Code" required error={errors.vCode}>
                  <input
                    type="text"
                    value={vCode}
                    onChange={(e) => setVCode(e.target.value.toUpperCase())}
                    readOnly={isAutoPromo}
                    className={`${inputClass} uppercase ${isAutoPromo ? lockedClass : ""} ${errors.vCode ? errorClass : ""}`}
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
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    readOnly={isAutoPromo}
                    className={`${inputClass} ${isAutoPromo ? lockedClass : ""} ${errors.usageLimit ? errorClass : ""}`}
                  />
                </FormField>
              </div>

              {/* Discount type toggle */}
              <FormField label="Discount Type" required>
                <div className="flex gap-3">
                  {(["PERCENTAGE", "FIXED"] as DiscountType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => !isAutoPromo && setDiscountType(type)}
                      className={`flex-1 rounded-[8px] border-2 py-2.5 text-sm font-semibold transition-colors ${
                        discountType === type
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-outline-variant/30 text-on-surface-variant"
                      }`}
                    >
                      {type === "PERCENTAGE"
                        ? "Percentage (%)"
                        : "Fixed Amount (₫)"}
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  label={
                    discountType === "PERCENTAGE"
                      ? "Discount (%)"
                      : "Discount (₫)"
                  }
                  required
                  error={errors.discountValue}
                >
                  <input
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    readOnly={isAutoPromo}
                    className={`${inputClass} ${isAutoPromo ? lockedClass : ""} ${errors.discountValue ? errorClass : ""}`}
                  />
                </FormField>
                <FormField
                  label="Max Discount (₫)"
                  required
                  error={errors.maxDiscount}
                >
                  <input
                    type="number"
                    min={0}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    readOnly={isAutoPromo}
                    className={`${inputClass} ${isAutoPromo ? lockedClass : ""} ${errors.maxDiscount ? errorClass : ""}`}
                  />
                </FormField>
                <FormField
                  label="Min Order (₫)"
                  required
                  error={errors.minOrder}
                >
                  <input
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    readOnly={isAutoPromo}
                    className={`${inputClass} ${isAutoPromo ? lockedClass : ""} ${errors.minOrder ? errorClass : ""}`}
                  />
                </FormField>
              </div>

              {/* Voucher dates chỉ hiện mode 3 — mode 2 follow campaign dates */}
              {configMode === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Voucher Start Date"
                    required
                    error={errors.vStartDate}
                  >
                    <input
                      type="date"
                      min={today}
                      value={vStartDate}
                      onChange={(e) => setVStartDate(e.target.value)}
                      readOnly={isAutoPromo}
                      className={`${inputClass} ${isAutoPromo ? lockedClass : ""} ${errors.vStartDate ? errorClass : ""}`}
                    />
                  </FormField>
                  <FormField
                    label="Voucher End Date"
                    required
                    error={errors.vEndDate}
                  >
                    <input
                      type="date"
                      min={vStartDate || today}
                      value={vEndDate}
                      onChange={(e) => setVEndDate(e.target.value)}
                      readOnly={isAutoPromo}
                      className={`${inputClass} ${isAutoPromo ? lockedClass : ""} ${errors.vEndDate ? errorClass : ""}`}
                    />
                  </FormField>
                </div>
              )}

              {/* Reusable toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => !isAutoPromo && setReusable((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${reusable ? "bg-primary" : "bg-outline-variant"}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${reusable ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
                <span className="text-sm font-medium text-on-surface">
                  Allow reuse per customer
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <Modal
          isOpen={!!submitError}
          onClose={() => setSubmitError(null)}
          variant="danger"
          title="Unable to Save Changes"
          message={submitError ?? ""}
          confirmText="Got it"
          onConfirm={() => setSubmitError(null)}
        />

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/admin/promotions/station/${stationId}`, {
                state: { stationName },
              })
            }
            className="rounded-[8px] border border-outline-variant/30 px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSubmitting}
            className="rounded-[8px] bg-primary px-8 py-3 text-sm font-bold text-white shadow-[0px_10px_25px_-5px_rgba(29,78,216,0.2)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

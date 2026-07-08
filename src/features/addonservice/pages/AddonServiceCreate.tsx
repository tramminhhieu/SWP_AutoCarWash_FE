import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Puzzle, Save } from "lucide-react";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { create, getServiceCategoryOptions } from "../api/addonServiceApi";
import type { ServiceCategoryOption } from "../types/addonService";

const inputClass = (hasError: boolean, hasSuffix = false) =>
  `w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
    hasSuffix ? "pr-14" : ""
  } ${hasError ? "border-error" : "border-outline-variant focus:border-primary"}`;
const labelClass = "mb-1.5 block text-label-md text-on-surface-variant";
const errorTextClass = "mt-1.5 text-label-sm text-error";

// Tắt mũi tên native của <select> (canh lệch giữa các trình duyệt) - tự vẽ ChevronDown
// canh giữa tuyệt đối theo chiều dọc, đồng bộ với SubscriptionPlanForm.tsx.
function SelectField({
  label,
  error,
  children,
  ...selectProps
}: {
  label: string;
  error?: string | null;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <select
          {...selectProps}
          className={`${inputClass(!!error)} appearance-none pr-10`}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={2.25}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
    </div>
  );
}

function FieldWithSuffix({
  label,
  suffix,
  error,
  children,
}: {
  label: string;
  suffix: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        {children}
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-label-sm text-on-surface-variant">
          {suffix}
        </span>
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
    </div>
  );
}

// ⚠️ Chưa có AC/API chính thức cho Add-on trong Note.md - xem comment trong
// addonService.ts / addonServiceApi.ts. Layout tham khảo prototype "Add New Add-on".
export default function AddonServiceCreate() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [categories, setCategories] = useState<ServiceCategoryOption[]>([]);

  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getServiceCategoryOptions().then(setCategories);
  }, []);

  const validate = (): boolean => {
    let isValid = true;
    setNameError(null);
    setPriceError(null);
    setDurationError(null);
    setCategoryError(null);

    if (!name.trim()) {
      setNameError("Name is required.");
      isValid = false;
    }
    if (!serviceCategoryId) {
      setCategoryError("Category is required.");
      isValid = false;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setPriceError("Must be greater than 0.");
      isValid = false;
    }
    const durationNum = Number(durationMinutes);
    if (!durationMinutes || Number.isNaN(durationNum) || durationNum <= 0) {
      setDurationError("Must be greater than 0.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await create({
        name: name.trim(),
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        serviceCategoryId: Number(serviceCategoryId),
      });
      navigate("/admin/subscription-plans", {
        state: { successMessage: result.message },
      });
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setFormError(message ?? "Unable to create add-on. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-headline-lg text-on-surface">Add New Add-on</h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        A supplemental service for any base wash package.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6"
      >
        <div className="mb-5 flex items-center gap-2 border-b border-outline-variant pb-4">
          <Puzzle size={18} className="text-primary" />
          <h2 className="font-heading text-body-lg font-bold text-on-surface">
            Add-on Information
          </h2>
        </div>

        {formError && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {formError}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clay Bar Treatment"
              className={inputClass(!!nameError)}
            />
            {nameError && <p className={errorTextClass}>{nameError}</p>}
          </div>

          <SelectField
            label="Service Category"
            value={serviceCategoryId}
            onChange={(e) => setServiceCategoryId(e.target.value)}
            error={categoryError}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <div className="grid grid-cols-2 gap-5">
            <FieldWithSuffix label="Price" suffix="VND" error={priceError}>
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="60,000"
                className={inputClass(!!priceError, true)}
              />
            </FieldWithSuffix>

            <FieldWithSuffix label="Duration" suffix="min" error={durationError}>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="15"
                className={inputClass(!!durationError, true)}
              />
            </FieldWithSuffix>
          </div>
        </div>

        <div className="my-6 border-t border-outline-variant" />

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/subscription-plans/create")}
            disabled={isSubmitting}
            className="text-body-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors ${
              isSubmitting
                ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                : "bg-primary text-on-primary hover:opacity-90"
            }`}
          >
            <Save size={16} />
            {isSubmitting ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

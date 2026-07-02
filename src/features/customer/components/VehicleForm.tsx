import { useState } from "react";
import { Car, Save } from "lucide-react";
import { addVehicle } from "../api/vehicleApi";
import { LICENSE_PLATE_ALREADY_EXISTS } from "../types/vehicle";
import { getApiErrorInfo } from "../../../lib/axiosClient";

// Regex biển số VN: 2 số đầu (mã tỉnh) + 1-2 chữ (trừ I, O dễ nhầm số) + "-" + 4-5 số
// Theo đúng AC đã chốt: ^[0-9]{2}[A-HJ-NP-Z]{1,2}-[0-9]{4,5}$
const LICENSE_PLATE_REGEX = /^[0-9]{2}[A-HJ-NP-Z]{1,2}-[0-9]{4,5}$/;
const UNICODE_TEXT_REGEX = /^[\p{L}\s-]+$/u;
const MAX_FIELD_LENGTH = 20;

interface VehicleFormProps {
  // Gọi khi thêm xe thành công, kèm message từ BE để page cha hiển thị thông báo
  onSuccess: (message?: string) => void;
  onCancel: () => void;
}

const VehicleForm = ({ onSuccess, onCancel }: VehicleFormProps) => {
  const [licensePlate, setLicensePlate] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");

  // Lỗi riêng từng field
  const [licensePlateError, setLicensePlateError] = useState<string | null>(
    null,
  );
  const [colorError, setColorError] = useState<string | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
  // Lỗi chung của form (vd: lỗi mạng, lỗi không xác định được customer)
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate ở FE trước khi gọi API: rỗng + format + max length
  // (Biển số trùng do BE check, xử lý riêng ở handleSubmit khi catch lỗi)
  const validate = (): boolean => {
    let isValid = true;
    setLicensePlateError(null);
    setColorError(null);
    setBrandError(null);

    const plate = licensePlate.trim().toUpperCase();
    if (!plate) {
      setLicensePlateError("License plate is required");
      isValid = false;
    } else if (!LICENSE_PLATE_REGEX.test(plate)) {
      setLicensePlateError(
        "Invalid license plate format (e.g., 29A-12345 or 51AB-12345)",
      );
      isValid = false;
    }

    if (!brand.trim()) {
      setBrandError("Brand is required");
      isValid = false;
    } else if (!UNICODE_TEXT_REGEX.test(brand.trim())) {
      setBrandError("Brand must contain only letters");
      isValid = false;
    } else if (brand.trim().length > MAX_FIELD_LENGTH) {
      setBrandError(`Brand cannot exceed ${MAX_FIELD_LENGTH} characters`);
      isValid = false;
    }

    if (!color.trim()) {
      setColorError("Color is required");
      isValid = false;
    } else if (!UNICODE_TEXT_REGEX.test(color.trim())) {
      setColorError("Color must contain only letters");
      isValid = false;
    } else if (color.trim().length > MAX_FIELD_LENGTH) {
      setColorError(`Color cannot exceed ${MAX_FIELD_LENGTH} characters`);
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
      const result = await addVehicle({
        licensePlate: licensePlate.trim().toUpperCase(),
        brandName: brand.trim(),
        color: color.trim(),
      });

      onSuccess(result.message);
    } catch (error) {
      const { errorCode, message } = getApiErrorInfo(error);

      // Biển số đã tồn tại -> highlight đúng field License Plate, không phải lỗi chung
      if (errorCode === LICENSE_PLATE_ALREADY_EXISTS) {
        setLicensePlateError(
          message ?? "License plate already exists in the system",
        );
      } else {
        setFormError(message ?? "Unable to add vehicle. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]"
    >
      <div className="flex items-center gap-2 pb-6">
        <Car size={20} className="text-primary" />
        <h2 className="text-headline-md text-on-surface">
          Vehicle Information
        </h2>
      </div>

      {formError && (
        <div className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {formError}
        </div>
      )}

      {/* License Plate - full width, luôn hiển thị in hoa khi gõ */}
      <div className="mb-5">
        <label
          htmlFor="licensePlate"
          className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
        >
          License Plate
        </label>
        <input
          id="licensePlate"
          type="text"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
          placeholder="12A-45678"
          maxLength={10}
          className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
            ${licensePlateError ? "border-error" : "border-outline-variant focus:border-primary"}`}
        />
        {licensePlateError && (
          <p className="mt-1.5 text-label-md text-error">{licensePlateError}</p>
        )}
      </div>

      {/* Color + Brand - 2 cột, theo đúng mockup */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="color"
            className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
          >
            Color
          </label>
          <input
            id="color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Shark Blue"
            maxLength={MAX_FIELD_LENGTH}
            className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
              ${colorError ? "border-error" : "border-outline-variant focus:border-primary"}`}
          />
          {colorError && (
            <p className="mt-1.5 text-label-md text-error">{colorError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="brand"
            className="mb-1.5 block text-label-md uppercase tracking-wide text-on-surface-variant"
          >
            Brand
          </label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Porsche"
            maxLength={MAX_FIELD_LENGTH}
            className={`w-full rounded-lg border  px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60
              ${brandError ? "border-error" : "border-outline-variant focus:border-primary"}`}
          />
          {brandError && (
            <p className="mt-1.5 text-label-md text-error">{brandError}</p>
          )}
        </div>
      </div>

      <div className="my-7 border-t border-outline-variant" />

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-body-md font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
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
          {isSubmitting ? "Saving..." : "Save Vehicle"}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Check } from "lucide-react";
import Loading from "../../../components/ui/Loading";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getVehicleOptions } from "../../subscription/api/subscriptionApi";
import type { RegisterVehicleOption } from "../../subscription/types/subscription";
import { createFamilyGroup } from "../api/familyGroupApi";
import { FAMILY_GROUP_ERROR_CODES } from "../types/familyGroup";
import type { FamilyGroupFieldError } from "../types/familyGroup";

const labelClass = "mb-1.5 block text-label-md text-on-surface-variant";
const errorTextClass = "mt-1.5 text-label-sm text-error";
const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
    hasError ? "border-error" : "border-outline-variant focus:border-primary"
  }`;

const GROUP_NAME_MAX_LENGTH = 100;

// UI luôn tiếng Anh (kể cả khi BE trả message tiếng Việt) - dùng message riêng theo errorCode
// giống pattern applyServerFieldErrors ở Register.tsx, chỉ fallback về message thô của BE khi
// gặp errorCode lạ chưa map.
const FAMILY_GROUP_ERROR_MESSAGES: Record<string, string> = {
  [FAMILY_GROUP_ERROR_CODES.GROUP_NAME_CANNOT_BE_EMPTY]: "Group name is required.",
  [FAMILY_GROUP_ERROR_CODES.GROUP_NAME_TOO_LONG]: `Group name must be ${GROUP_NAME_MAX_LENGTH} characters or fewer.`,
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_REQUIRED]:
    "Please select a vehicle to activate group ownership.",
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_ALREADY_IN_ANOTHER_GROUP]:
    "This vehicle is already registered under another family group.",
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_INVALID]: "This vehicle is not available for selection.",
  [FAMILY_GROUP_ERROR_CODES.CUSTOMER_ALREADY_HAS_FAMILY_GROUP]:
    "You already own or belong to another family group. You cannot create a new one.",
  [FAMILY_GROUP_ERROR_CODES.CUSTOMER_NOT_FOUND]:
    "Unable to verify your account. Please sign in again.",
};

// API-17-01: AC01/AC02/AC05 - form tạo Family Group, chọn 1 xe của chính mình để kích hoạt
// tư cách chủ nhóm. Sau khi tạo thành công, redirect sang /family (AC08).
export default function FamilyGroupCreate() {
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [vehicles, setVehicles] = useState<RegisterVehicleOption[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const [groupNameError, setGroupNameError] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  // Lỗi nghiệp vụ cấp trang, không gắn được vào field cụ thể (vd đã có group khác) - AC03.
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getVehicleOptions()
      .then(setVehicles)
      .catch(() => setFormError("Unable to load your vehicles."))
      .finally(() => setIsLoadingVehicles(false));
  }, []);

  // AC02: validate phía client trước khi gửi - BE không trả lỗi theo field (chỉ trả
  // {message, errorCode} phẳng), nên các case bắt được ở đây coi như chặn đủ trước khi gọi API.
  const validate = (): boolean => {
    let isValid = true;
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setGroupNameError("Group name is required.");
      isValid = false;
    } else if (trimmedName.length > GROUP_NAME_MAX_LENGTH) {
      setGroupNameError(
        `Group name must be ${GROUP_NAME_MAX_LENGTH} characters or fewer.`,
      );
      isValid = false;
    }

    if (selectedVehicleId === null) {
      setVehicleError("Please select a vehicle to activate group ownership.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupNameError(null);
    setVehicleError(null);
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await createFamilyGroup({
        groupName: groupName.trim(),
        vehicleId: selectedVehicleId as number,
      });
      navigate("/family", {
        state: {
          successMessage: `Family group "${result.groupName}" created successfully!`,
        },
      });
    } catch (err) {
      // BE có 2 dạng response lỗi đã thấy trên endpoint này - xử lý cả 2 để không vỡ khi BE
      // đổi qua lại giữa 2 dạng:
      // 1. Mảng errors[] {field, errorCode, message} - có thể trả NHIỀU lỗi cùng lúc (vd vừa
      //    trống groupName vừa đã có group khác) - cùng pattern Register.tsx đang dùng.
      // 2. Dạng phẳng {errorCode, message} 1 lỗi duy nhất - dạng BusinessException hiện tại
      //    của FamilyGroupServiceImpl.createFamilyGroup() đang trả (throw dừng ở lỗi đầu tiên).
      const fieldErrors = (
        err as { response?: { data?: { errors?: FamilyGroupFieldError[] } } }
      )?.response?.data?.errors;

      if (fieldErrors?.length) {
        const bannerMessages: string[] = [];
        fieldErrors.forEach(({ field, errorCode, message }) => {
          const text = FAMILY_GROUP_ERROR_MESSAGES[errorCode] ?? message;
          if (field === "groupName") setGroupNameError(text);
          else if (field === "vehicleId") setVehicleError(text);
          else bannerMessages.push(text);
        });
        if (bannerMessages.length) setFormError(bannerMessages.join(" "));
      } else {
        const { errorCode, message } = getApiErrorInfo(err);
        const text =
          (errorCode && FAMILY_GROUP_ERROR_MESSAGES[errorCode]) ??
          message ??
          "Unable to create family group. Please try again.";
        switch (errorCode) {
          case FAMILY_GROUP_ERROR_CODES.GROUP_NAME_CANNOT_BE_EMPTY:
          case FAMILY_GROUP_ERROR_CODES.GROUP_NAME_TOO_LONG:
            setGroupNameError(text);
            break;
          case FAMILY_GROUP_ERROR_CODES.VEHICLE_REQUIRED:
          case FAMILY_GROUP_ERROR_CODES.VEHICLE_ALREADY_IN_ANOTHER_GROUP:
          case FAMILY_GROUP_ERROR_CODES.VEHICLE_INVALID:
            setVehicleError(text);
            break;
          default:
            setFormError(text);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-margin-mobile py-12 md:px-margin-desktop">
      <h1 className="font-heading text-headline-lg text-on-surface">
        Create Family Group
      </h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        Set up a shared plan for your household and activate your vehicle as the
        first member.
      </p>

      {formError && (
        <div className="mt-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className={labelClass}>Group Name</label>
          <input
            type="text"
            value={groupName}
            maxLength={GROUP_NAME_MAX_LENGTH}
            onChange={(e) => {
              setGroupName(e.target.value);
              setGroupNameError(null);
            }}
            placeholder="e.g. The Nguyen Family"
            className={inputClass(!!groupNameError)}
          />
          {groupNameError && <p className={errorTextClass}>{groupNameError}</p>}
        </div>

        <div>
          <p className="mb-3 text-label-md text-on-surface-variant">
            Select Your Vehicle
          </p>

          {isLoadingVehicles ? (
            <Loading rows={4} />
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center text-body-md text-on-surface-variant">
              No vehicles found. Add a vehicle first to create a family group.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {vehicles.map((v) => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      setVehicleError(null);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant bg-surface-container-lowest hover:border-primary/40"
                    }`}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
                      <Car size={20} className="text-primary/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md font-semibold text-on-surface">
                        {v.licensePlate}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {v.vehicleName}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check size={14} className="text-on-primary" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {vehicleError && <p className={errorTextClass}>{vehicleError}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Family Group"}
        </button>
      </form>
    </div>
  );
}

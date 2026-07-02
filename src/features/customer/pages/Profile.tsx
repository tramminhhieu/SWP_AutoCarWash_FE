import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Car,
  Edit2,
  RefreshCw,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Trophy,
  User,
  X,
  Check,
} from "lucide-react";
import { getCustomerProfile, updateCustomerProfile } from "../api/customerApi";
import type {
  CustomerProfileData,
  CustomerTier,
  CustomerVehicle,
  UpdateProfileRequest,
} from "../types/profile";
import Modal from "../../../components/ui/Modal";
import { getTierStyle } from "../../../constants/tierStyles";
import { getSubscriptionStyle } from "../../../constants/subscriptionStyles";

// "1985-12-06" → "12/06/1985" để hiển thị trong view mode
function formatBirthday(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

// ─── Sub-component: Tier progress card ───────────────────────────────────────
function TierCard({ tier }: { tier: CustomerTier }) {
  const style = getTierStyle(tier.currentTierName);
  // Progress bar: tính % điểm hiện tại so với mốc tier tiếp theo
  const progress = tier.nextTierMinPoints
    ? Math.min((tier.currentPoints / tier.nextTierMinPoints) * 100, 100)
    : 100;

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-white p-5 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
      {/* Header: label + tên tier hiện tại */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Current Tier
          </span>
        </div>
        <span className={`text-sm font-bold ${style.label}`}>
          {tier.currentTierName}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-outline-variant/30">
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Nhãn điểm hai đầu */}
      <div className="mb-4 flex justify-between text-xs text-on-surface-variant">
        <span>{tier.currentPoints.toLocaleString()} pts</span>
        {tier.nextTierMinPoints && (
          <span>{tier.nextTierMinPoints.toLocaleString()} pts</span>
        )}
      </div>

      {/* Thông tin cần bao nhiêu điểm để lên tier tiếp */}
      {tier.pointsToNextTier != null && tier.nextTierName ? (
        <div className="rounded-lg border border-outline-variant/40 py-2 text-center text-sm font-semibold text-primary">
          {tier.pointsToNextTier.toLocaleString()} pts to {tier.nextTierName}
        </div>
      ) : (
        <div className="rounded-lg border border-outline-variant/40 py-2 text-center text-sm font-semibold text-on-surface-variant">
          Maximum Tier Reached
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: 1 xe trong danh sách ─────────────────────────────────────
function VehicleItem({
  vehicle,
  isOnlyVehicle,
  openMenuId,
  onMenuToggle,
  onDelete,
  onTransfer,
}: {
  vehicle: CustomerVehicle;
  isOnlyVehicle: boolean;
  openMenuId: number | null;
  onMenuToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onTransfer: (vehicle: CustomerVehicle) => void;
}) {
  const navigate = useNavigate();
  const isMenuOpen = openMenuId === vehicle.id;
  const sub = vehicle.activeSubscription;
  const subStyle = sub ? getSubscriptionStyle(sub.type) : null;

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-[#F8FAFC] p-3">
      {/* Thumbnail placeholder xe */}
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
        <Car className="size-7 text-primary/50" />
      </div>

      {/* Tên + màu + badge gói */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-on-surface">
          {vehicle.brandName}
        </p>
        <p className="text-xs text-on-surface-variant">{vehicle.color}</p>
        {sub && subStyle && (
          <div
            className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${subStyle.badge} ${subStyle.border}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {sub.type}
            </span>
          </div>
        )}
      </div>

      {/* Nút 3 chấm */}
      <button
        onClick={() => onMenuToggle(vehicle.id)}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-outline-variant/20"
      >
        <MoreVertical className="size-4" />
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div className="absolute right-2 top-10 z-10 min-w-[160px] rounded-xl border border-outline-variant/30 bg-white shadow-[0_10px_25px_-5px_rgba(29,78,216,0.10)]">
          {/* Edit vehicle → sẽ navigate khi có page riêng */}
          <button
            onClick={() => navigate(`/customer/vehicles/${vehicle.id}/edit`)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-ice"
          >
            <Edit2 className="size-4 text-on-surface-variant" />
            Edit
          </button>

          {/* Transfer Plan: chỉ hiện khi có gói và có hơn 1 xe */}
          {sub &&
            !isOnlyVehicle &&
            (sub.hasTransferred ? (
              // AC3: đã dùng quyền transfer → disable
              <button
                disabled
                className="flex w-full cursor-not-allowed items-center gap-2 px-4 py-2.5 text-left text-sm text-on-surface-variant/50"
              >
                <ArrowLeftRight className="size-4" />
                Transfer Limit Reached
              </button>
            ) : (
              <button
                onClick={() => {
                  onTransfer(vehicle);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-ice"
              >
                <ArrowLeftRight className="size-4 text-on-surface-variant" />
                Transfer Plan
              </button>
            ))}

          <div className="border-t border-outline-variant/20" />

          {/* Delete vehicle */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Delete ${vehicle.brandName} (${vehicle.licensePlate})?\nThis action cannot be undone.`,
                )
              ) {
                onDelete(vehicle.id);
              }
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-error/5"
          >
            <X className="size-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Transfer Plan modal ──────────────────────────────────────
function TransferPlanModal({
  sourceVehicle,
  targetVehicles,
  selectedTargetId,
  isTransferring,
  onSelectTarget,
  onClose,
  onConfirm,
}: {
  sourceVehicle: CustomerVehicle;
  targetVehicles: CustomerVehicle[];
  selectedTargetId: number | null;
  isTransferring: boolean;
  onSelectTarget: (id: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const sub = sourceVehicle.activeSubscription;
  const subStyle = sub ? getSubscriptionStyle(sub.type) : null;

  return (
    // Overlay backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-on-surface">
            Transfer Plan
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-outline-variant/20"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Source Vehicle (xe có gói — fixed, không chọn được) */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Source Vehicle
        </p>
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-[#F8FAFC] p-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
            <Car className="size-6 text-primary/50" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-on-surface">
              {sourceVehicle.brandName}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">
                {sourceVehicle.color}
              </span>
              {sub && subStyle && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${subStyle.badge} ${subStyle.border}`}
                >
                  {sub.type}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mũi tên chỉ hướng chuyển gói */}
        <div className="my-3 flex justify-center">
          <div className="flex size-8 items-center justify-center rounded-full border border-outline-variant/40 bg-white shadow-sm">
            <ArrowLeftRight className="size-4 rotate-90 text-primary" />
          </div>
        </div>

        {/* Destination Vehicles (xe không có gói — chọn được) */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Select Destination Vehicle
        </p>

        {targetVehicles.length === 0 ? (
          <p className="rounded-xl border border-outline-variant/20 py-6 text-center text-sm text-on-surface-variant">
            No other vehicles available to transfer to.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {targetVehicles.map((v) => {
              const isSelected = selectedTargetId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelectTarget(v.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 bg-[#F8FAFC] hover:border-primary/40"
                  }`}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
                    <Car className="size-6 text-primary/50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">
                      {v.brandName}
                    </p>
                    <p className="text-xs text-on-surface-variant">{v.color}</p>
                  </div>
                  {/* Checkmark khi đã chọn */}
                  {isSelected && (
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="size-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Ghi chú giới hạn transfer */}
        <div className="mt-4 rounded-lg border border-outline-variant/20 bg-[#F8FAFC] px-4 py-2.5 text-xs text-on-surface-variant">
          Transfers are limited to once per month. Activation is immediate.
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isTransferring}
            className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-ice disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedTargetId || isTransferring}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isTransferring && (
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const navigate = useNavigate();

  // Data từ API
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Trạng thái form edit — chỉ 3 field được phép update (API-05-01)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: "",
    lastName: "",
    birthday: "",
  });
  // Lưu bản gốc để Cancel khôi phục lại (AC-01.5)
  const [originalData, setOriginalData] = useState<UpdateProfileRequest>({
    firstName: "",
    lastName: "",
    birthday: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateProfileRequest, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Menu 3 chấm của xe
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Transfer Plan modal
  const [transferSourceVehicle, setTransferSourceVehicle] =
    useState<CustomerVehicle | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Load profile khi vào trang
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await getCustomerProfile();
        if (cancelled) return;
        setProfile(res.data);
        const initial: UpdateProfileRequest = {
          firstName: res.data.customer.firstName,
          lastName: res.data.customer.lastName,
          birthday: res.data.customer.birthday,
        };
        setFormData(initial);
        setOriginalData(initial);
      } catch {
        if (!cancelled)
          setLoadError("Unable to load profile. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openMenuId !== null &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Ẩn thông báo thành công sau 3 giây
  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 1000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  // ── Form handlers ────────────────────────────────────────────────────────

  const handleEditStart = () => {
    setFieldErrors({});
    setSaveSuccess(false);
    setIsEditing(true);
  };

  // AC-01.5: cancel → reset về bản gốc, không lưu gì
  const handleCancel = () => {
    setFormData(originalData);
    setFieldErrors({});
    setIsEditing(false);
  };

  const hasChanges =
    formData.firstName !== originalData.firstName ||
    formData.lastName !== originalData.lastName ||
    formData.birthday !== originalData.birthday;

  const handleChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Xoá lỗi field ngay khi user bắt đầu sửa
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Validate FE — không gửi request nếu sai (AC-01.4)
  const validate = (): boolean => {
    const errs: typeof fieldErrors = {};
    if (!formData.firstName.trim()) errs.firstName = "This field is required";
    if (!formData.lastName.trim()) errs.lastName = "This field is required";
    if (formData.birthday && new Date(formData.birthday) > new Date()) {
      errs.birthday = "Date of birth cannot be in the future";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // AC-01.1: Save → gọi API → cập nhật state từ response ngay lập tức
  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const res = await updateCustomerProfile(formData);
      setProfile((prev) => (prev ? { ...prev, customer: res.data } : prev));
      setOriginalData(formData);
      setIsEditing(false);
      setSaveSuccess(true);
    } catch (err) {
      // Email/phone không còn update được nên không còn lỗi field-level từ BE
      console.error("Update profile failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Xoá xe khỏi local state (mock delete — gọi API-04-03 khi có BE)
  const handleDeleteVehicle = (vehicleId: number) => {
    setProfile((prev) =>
      prev
        ? { ...prev, vehicles: prev.vehicles.filter((v) => v.id !== vehicleId) }
        : prev,
    );
    setOpenMenuId(null);
  };

  // Mở Transfer Plan modal cho xe nguồn được chọn
  const handleOpenTransfer = (vehicle: CustomerVehicle) => {
    setTransferSourceVehicle(vehicle);
    setSelectedTargetId(null);
    setOpenMenuId(null);
  };

  // Confirm Transfer — mock: chuyển subscription từ xe nguồn sang xe đích trong local state
  // Thay bằng gọi POST /api/subscriptions/transfer (API-06-01) khi có BE
  const handleConfirmTransfer = async () => {
    if (!transferSourceVehicle || !selectedTargetId || !profile) return;
    setIsTransferring(true);
    try {
      // Giả lập network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Cập nhật local state: chuyển subscription sang xe đích, đánh dấu xe nguồn đã transfer
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vehicles: prev.vehicles.map((v) => {
            if (v.id === transferSourceVehicle.id) {
              // Xe nguồn: xoá subscription
              return { ...v, activeSubscription: undefined };
            }
            if (v.id === selectedTargetId) {
              // Xe đích: nhận subscription từ xe nguồn
              return {
                ...v,
                activeSubscription: transferSourceVehicle.activeSubscription,
              };
            }
            return v;
          }),
        };
      });
      setTransferSourceVehicle(null);
    } finally {
      setIsTransferring(false);
    }
  };

  // ── Loading / error state (Cách 1: early return vì cả trang phụ thuộc vào 1 load) ──

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex gap-6">
            <div className="h-64 w-[300px] animate-pulse rounded-2xl bg-outline-variant/20" />
            <div className="h-64 flex-1 animate-pulse rounded-2xl bg-outline-variant/20" />
          </div>
        </div>
      </main>
    );
  }

  if (loadError || !profile) {
    return (
      <main className="min-h-screen bg-surface py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex items-center justify-center rounded-2xl border border-error/30 bg-error/5 p-10 text-sm text-error">
            {loadError ?? "Something went wrong."}
          </div>
        </div>
      </main>
    );
  }

  const { customer, tier, vehicles } = profile;
  const tierStyle = getTierStyle(tier?.currentTierName ?? "Member");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex items-start gap-6">
          {/* ═══ CỘT TRÁI: sidebar ═══════════════════════════════════════════ */}
          <div className="flex w-[300px] shrink-0 flex-col gap-4">
            {/* Card avatar + tên + badge */}
            <div className="rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
              <div className="flex flex-col items-center gap-3">
                {/* Avatar icon thay ảnh thật (chưa có API lưu avatar) */}
                <div className="relative">
                  <div className="flex size-24 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
                    <User className="size-14 text-primary/40" />
                  </div>
                </div>

                {/* Tên */}
                <h2 className="font-heading text-xl font-bold text-on-surface">
                  {customer.firstName} {customer.lastName}
                </h2>

                {/* Badges tier + gói */}
                <div className="flex flex-wrap justify-center gap-2">
                  {tier && (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${tierStyle.badge}`}
                    >
                      {tier.currentTierName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tier progress card (ẩn khi tier === null — BE chưa code) */}
            {tier && <TierCard tier={tier} />}
          </div>

          {/* ═══ CỘT PHẢI: form + vehicles ══════════════════════════════════ */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="rounded-2xl border border-outline-variant/30 bg-white p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
              {/* Thông báo lưu thành công (AC-01.1) */}
              <Modal
                isOpen={saveSuccess}
                onClose={() => setSaveSuccess(false)}
                variant="success"
                title="Updated Successfully"
                message="Your information has been updated successfully."
              />

              {/* Grid 2 cột: First Name | Last Name */}
              <div className="grid grid-cols-2 gap-5">
                {/* First Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.firstName : customer.firstName}
                    disabled={!isEditing}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className={`rounded-lg border px-4 py-3 text-sm text-on-surface transition-colors outline-none
                      disabled:cursor-default disabled:opacity-100
                      ${
                        isEditing
                          ? "border-outline-variant bg-white focus:border-primary"
                          : "border-outline-variant/40 bg-[#F8FAFC]"
                      }
                      ${fieldErrors.firstName ? "border-error" : ""}
                    `}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-xs text-error">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? formData.lastName : customer.lastName}
                    disabled={!isEditing}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className={`rounded-lg border px-4 py-3 text-sm text-on-surface transition-colors outline-none
                      disabled:cursor-default disabled:opacity-100
                      ${
                        isEditing
                          ? "border-outline-variant bg-white focus:border-primary"
                          : "border-outline-variant/40 bg-[#F8FAFC]"
                      }
                      ${fieldErrors.lastName ? "border-error" : ""}
                    `}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-error">{fieldErrors.lastName}</p>
                  )}
                </div>

                {/* Email (có icon) */}
                {/* Email — read-only, là định danh đăng nhập không cho sửa */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="email"
                      value={customer.email}
                      disabled
                      className="w-full rounded-lg border border-outline-variant/40 bg-[#F8FAFC] py-3 pl-10 pr-4 text-sm text-on-surface outline-none disabled:cursor-default disabled:opacity-100"
                    />
                  </div>
                </div>

                {/* Phone Number — read-only, là định danh đăng nhập không cho sửa */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="tel"
                      value={customer.phone}
                      disabled
                      className="w-full rounded-lg border border-outline-variant/40 bg-[#F8FAFC] py-3 pl-10 pr-4 text-sm text-on-surface outline-none disabled:cursor-default disabled:opacity-100"
                    />
                  </div>
                </div>

                {/* Date of Birth (full width vì không có Gender — không có trong DB) */}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.birthday}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => handleChange("birthday", e.target.value)}
                      className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary
                        ${fieldErrors.birthday ? "border-error" : "border-outline-variant"}
                      `}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formatBirthday(customer.birthday)}
                      disabled
                      className="rounded-lg border border-outline-variant/40 bg-[#F8FAFC] px-4 py-3 text-sm text-on-surface disabled:cursor-default disabled:opacity-100"
                    />
                  )}
                  {fieldErrors.birthday && (
                    <p className="text-xs text-error">{fieldErrors.birthday}</p>
                  )}
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-8 flex justify-end gap-3">
                {isEditing ? (
                  <>
                    {/* AC-01.5: Cancel → reset về bản gốc */}
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-ice disabled:opacity-50"
                    >
                      <X className="size-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Change Password → trang đổi mật khẩu (API-05-03 đã thiết kế) */}
                    <button
                      onClick={() =>
                        navigate("/customer/profile/change-password")
                      }
                      className="flex items-center gap-2 rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-ice"
                    >
                      <RefreshCw className="size-4" />
                      Change Password
                    </button>
                    <button
                      onClick={handleEditStart}
                      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                      <Edit2 className="size-4" />
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Vehicles card — cùng width form vì nằm trong flex-1 */}
            <div className="rounded-2xl border border-outline-variant/30 bg-white p-5 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-on-surface">
                    Vehicles
                  </span>
                </div>
                <button
                  onClick={() => navigate("/customer/vehicles/add")}
                  className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  <Plus className="size-5" />
                  Add Vehicle
                </button>
              </div>

              {vehicles.length === 0 ? (
                <p className="py-4 text-center text-sm text-on-surface-variant">
                  No vehicles registered yet.
                </p>
              ) : (
                // ref dùng để detect click ngoài dropdown
                <div ref={menuRef} className="flex flex-col gap-2">
                  {vehicles.map((vehicle) => (
                    <VehicleItem
                      key={vehicle.id}
                      vehicle={vehicle}
                      isOnlyVehicle={vehicles.length === 1} // AC4: chỉ 1 xe → ẩn Transfer Plan
                      openMenuId={openMenuId}
                      onMenuToggle={(id) =>
                        setOpenMenuId(openMenuId === id ? null : id)
                      }
                      onDelete={handleDeleteVehicle}
                      onTransfer={handleOpenTransfer}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Plan modal — hiện khi customer click Transfer Plan từ menu xe */}
      {transferSourceVehicle && (
        <TransferPlanModal
          sourceVehicle={transferSourceVehicle}
          // Xe đích: chỉ xe không có gói đang active
          targetVehicles={vehicles.filter((v) => !v.activeSubscription)}
          selectedTargetId={selectedTargetId}
          isTransferring={isTransferring}
          onSelectTarget={setSelectedTargetId}
          onClose={() => setTransferSourceVehicle(null)}
          onConfirm={handleConfirmTransfer}
        />
      )}
    </main>
  );
}

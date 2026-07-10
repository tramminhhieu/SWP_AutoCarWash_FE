import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Car,
  Check,
  Lock,
  Mail,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import Loading from "../../../components/ui/Loading";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import {
  addMember,
  dissolveGroup,
  getFamilyGroup,
  removeMember,
  updateMemberVehicle,
} from "../api/familyGroupApi";
import { getVehicleOptions } from "../api/subscriptionApi";
import type { AddFamilyMemberRequest, FamilyGroupDetail, FamilyMember } from "../types/familyGroup";
import type { RegisterVehicleOption } from "../types/subscription";

// Family Group Management - không có AC/API trong Note.md, build theo yêu cầu Nora +
// mockup "Car Wash Prototype (1).zip" (màn "Membership Management" / "Member Details").
// Vào từ nút "Manage Family" trên card FAMILY đang ACTIVE ở MySubscriptions.tsx.

const inputClass =
  "w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary";
const labelClass = "mb-1.5 block text-label-md text-on-surface-variant";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
  return initials.toUpperCase();
}

function MemberAvatar({ member, size = 44 }: { member: FamilyMember; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-label-md font-bold text-primary"
    >
      {member.name === "You" ? (
        <UserRound size={size * 0.5} className="text-primary" />
      ) : (
        initialsOf(member.name)
      )}
    </div>
  );
}

function MemberRow({ member, onOpen }: { member: FamilyMember; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <MemberAvatar member={member} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-body-md font-semibold text-on-surface">
              {member.name}
            </p>
            {member.isOwner && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary">
                YOU
              </span>
            )}
          </div>
          <p className="text-label-sm text-on-surface-variant">
            {member.isOwner ? "Owner" : "Member"} · Added {formatDate(member.addedAt)}
          </p>
        </div>
      </div>

      {member.vehicle ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-label-sm font-semibold text-on-surface">
          <Car size={14} />
          {member.vehicle.licensePlate}
        </span>
      ) : (
        <span className="shrink-0 text-label-sm text-on-surface-variant">
          No vehicle registered
        </span>
      )}
    </button>
  );
}

function MemberDetailsModal({
  member,
  onClose,
  onUpdateVehicle,
  onRemove,
}: {
  member: FamilyMember;
  onClose: () => void;
  onUpdateVehicle: () => void;
  onRemove: () => void;
}) {
  const isLocked =
    !!member.vehicleChangeLockedUntil && new Date(member.vehicleChangeLockedUntil) > new Date();

  return (
    <Modal isOpen onClose={onClose} variant="custom">
      <div className="flex w-full flex-col items-center gap-1">
        <MemberAvatar member={member} size={72} />
        <p className="mt-2 font-heading text-body-lg font-bold text-on-surface">
          {member.name}
        </p>
      </div>

      <div className="mt-5 w-full space-y-3 text-left">
        <div className="flex items-center gap-3 rounded-lg bg-surface-container p-3">
          <Phone size={16} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-label-sm text-on-surface-variant">Phone</p>
            <p className="truncate text-body-md font-semibold text-on-surface">
              {member.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-surface-container p-3">
          <Mail size={16} className="shrink-0 text-tertiary" />
          <div className="min-w-0">
            <p className="text-label-sm text-on-surface-variant">Email</p>
            <p className="truncate text-body-md font-semibold text-on-surface">
              {member.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-surface-container p-3">
          <Car size={16} className="shrink-0 text-secondary" />
          <div className="min-w-0">
            <p className="text-label-sm text-on-surface-variant">License Plate</p>
            <p className="truncate text-body-md font-semibold text-on-surface">
              {member.vehicle?.licensePlate ?? "No vehicle registered"}
            </p>
          </div>
        </div>
        {isLocked && (
          <p className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <Lock size={12} />
            Vehicle change locked until {formatDate(member.vehicleChangeLockedUntil)}
          </p>
        )}
      </div>

      <div className="mt-6 flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={onUpdateVehicle}
          disabled={isLocked}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLocked && <Lock size={15} />}
          Update Vehicle
        </button>
        {member.isOwner ? (
          <p className="py-2 text-center text-label-md font-semibold text-on-surface-variant">
            Cannot remove Owner
          </p>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            className="w-full rounded-lg border border-error/40 px-6 py-3 text-body-md font-semibold text-error hover:bg-error-container"
          >
            Remove from Group
          </button>
        )}
      </div>
    </Modal>
  );
}

// BL-AC-22: mỗi thành viên chỉ được link 1 xe THUỘC SỞ HỮU CỦA HỌ vào Family Group - với
// chính chủ tài khoản đang đăng nhập (member.isOwner), lấy đúng danh sách xe thật của họ
// qua getVehicleOptions() (API profile thật, cùng hàm SubscriptionRegister.tsx dùng) và bắt
// chọn từ đó thay vì gõ tay. Với các thành viên khác (mock, không phải tài khoản đang đăng
// nhập) demo này không có cách nào lấy danh sách xe THẬT của họ (không có multi-account
// trong session) nên vẫn giữ nhập tay, có ghi chú rõ đây là giới hạn của demo.
function UpdateVehicleModal({
  member,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: {
  member: FamilyMember;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (licensePlate: string, vehicleName: string) => void;
}) {
  const [licensePlate, setLicensePlate] = useState(member.vehicle?.licensePlate ?? "");
  const [vehicleName, setVehicleName] = useState(member.vehicle?.vehicleName ?? "");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ownVehicles, setOwnVehicles] = useState<RegisterVehicleOption[] | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(member.isOwner);

  useEffect(() => {
    if (!member.isOwner) return;
    let isMounted = true;
    getVehicleOptions()
      .then((vehicles) => {
        if (!isMounted) return;
        setOwnVehicles(vehicles);
        const current = vehicles.find((v) => v.licensePlate === member.vehicle?.licensePlate);
        if (current) setSelectedId(current.id);
      })
      .finally(() => {
        if (isMounted) setIsLoadingVehicles(false);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.isOwner]);

  const selectedVehicle = ownVehicles?.find((v) => v.id === selectedId) ?? null;
  const canSave = member.isOwner
    ? !!selectedVehicle
    : !!licensePlate.trim() && !!vehicleName.trim();

  return (
    <Modal isOpen onClose={onClose} variant="custom">
      <div className="w-full text-left">
        <p className="font-heading text-body-lg font-bold text-on-surface">
          Update Vehicle
        </p>
        <p className="mt-1 text-body-md text-on-surface-variant">
          For {member.name}
        </p>

        {member.isOwner ? (
          isLoadingVehicles ? (
            <div className="mt-5">
              <Loading rows={2} />
            </div>
          ) : !ownVehicles || ownVehicles.length === 0 ? (
            <p className="mt-5 rounded-lg border border-outline-variant bg-surface-container px-4 py-3 text-body-md text-on-surface-variant">
              No vehicles found on your account. Add a vehicle first.
            </p>
          ) : (
            <div className="mt-5 flex flex-col gap-2.5">
              {ownVehicles.map((v) => {
                const isSelected = selectedId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant bg-surface-container-lowest hover:border-primary/40"
                    }`}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
                      <Car size={18} className="text-primary/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md font-semibold text-on-surface">
                        {v.licensePlate}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">{v.vehicleName}</p>
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
          )
        ) : (
          <>
            <p className="mt-3 text-label-sm text-on-surface-variant">
              Demo limitation: {member.name} isn't the logged-in account, so their real
              vehicle list can't be looked up here - enter the vehicle manually instead.
            </p>
            <div className="mt-3 space-y-4">
              <div>
                <label className={labelClass}>License Plate</label>
                <input
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="e.g. 65A-12345"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Vehicle Name</label>
                <input
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="e.g. Toyota Vios"
                  className={inputClass}
                />
              </div>
            </div>
          </>
        )}

        {errorMessage && (
          <p className="mt-3 text-label-sm text-error">{errorMessage}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-lg border border-secondary px-6 py-3 text-body-md font-semibold text-secondary hover:bg-secondary/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              member.isOwner && selectedVehicle
                ? onSave(selectedVehicle.licensePlate, selectedVehicle.vehicleName)
                : onSave(licensePlate.trim(), vehicleName.trim())
            }
            disabled={isSaving || !canSave}
            className="flex-1 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// BL-AC-19: người được thêm phải là customer đã có tài khoản trong hệ thống - chỉ nhận
// email để tra cứu (giống 1 lời mời), không cho tự gõ tên/sđt nữa (familyGroupApi.ts sẽ
// lấy tên/sđt thật từ tài khoản tìm được, reject nếu không tìm thấy hoặc đã ở group khác).
function AddMemberModal({
  isSaving,
  errorMessage,
  onClose,
  onAdd,
}: {
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onAdd: (data: AddFamilyMemberRequest) => void;
}) {
  const [email, setEmail] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleName, setVehicleName] = useState("");

  const canSubmit = email.trim();

  return (
    <Modal isOpen onClose={onClose} variant="custom">
      <div className="w-full text-left">
        <p className="font-heading text-body-lg font-bold text-on-surface">
          Add Member
        </p>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Enter the email of an existing account to add them to your family group.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. emma.w@example.com"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>License Plate (optional)</label>
              <input
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="65A-12345"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Vehicle Name (optional)</label>
              <input
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="Toyota Vios"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-3 text-label-sm text-error">{errorMessage}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-lg border border-secondary px-6 py-3 text-body-md font-semibold text-secondary hover:bg-secondary/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onAdd({
                email: email.trim(),
                licensePlate: licensePlate.trim() || undefined,
                vehicleName: vehicleName.trim() || undefined,
              })
            }
            disabled={isSaving || !canSubmit}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus size={16} />
            {isSaving ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function FamilyGroupManage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();
  const id = Number(subscriptionId);

  const [group, setGroup] = useState<FamilyGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [openMemberId, setOpenMemberId] = useState<number | null>(null);
  const [vehicleEditMemberId, setVehicleEditMemberId] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isDissolveOpen, setIsDissolveOpen] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);

  const load = useCallback(() => {
    if (!id || Number.isNaN(id)) {
      setLoadError("Invalid family group.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getFamilyGroup(id)
      .then(setGroup)
      .catch((err) => {
        const { message } = getApiErrorInfo(err);
        setLoadError(message ?? "Unable to load family group.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openMember = group?.members.find((m) => m.id === openMemberId) ?? null;
  const vehicleEditMember = group?.members.find((m) => m.id === vehicleEditMemberId) ?? null;
  const isFull = !!group && group.members.length >= group.maxVehicleCount;

  const handleAddMember = async (data: AddFamilyMemberRequest) => {
    if (!group) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await addMember(group.subscriptionId, data);
      setIsAddOpen(false);
      load();
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setModalError(message ?? "Unable to add member.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateVehicle = async (licensePlate: string, vehicleName: string) => {
    if (!group || !vehicleEditMember) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await updateMemberVehicle(group.subscriptionId, vehicleEditMember.id, {
        licensePlate,
        vehicleName,
      });
      setVehicleEditMemberId(null);
      setOpenMemberId(null);
      load();
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setModalError(message ?? "Unable to update vehicle.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!group || !memberToRemove) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await removeMember(group.subscriptionId, memberToRemove.id);
      setMemberToRemove(null);
      setOpenMemberId(null);
      load();
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setActionError(message ?? "Unable to remove member.");
      setMemberToRemove(null);
    } finally {
      setIsSaving(false);
    }
  };

  // BL-AC-21: chỉ owner mới giải tán được nhóm (owner luôn là "You" trong demo này, nút chỉ
  // hiện trên trang này vốn chỉ owner mới vào được qua "Manage Family" ở MySubscriptions).
  const handleConfirmDissolve = async () => {
    if (!group) return;
    setIsDissolving(true);
    try {
      await dissolveGroup(group.subscriptionId);
      navigate("/subscription", {
        state: { successMessage: "Your family group has been dissolved." },
      });
    } catch (err) {
      const { message } = getApiErrorInfo(err);
      setActionError(message ?? "Unable to dissolve group.");
      setIsDissolveOpen(false);
    } finally {
      setIsDissolving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile py-12 md:px-margin-desktop">
      {isLoading ? (
        <Loading rows={4} />
      ) : loadError ? (
        <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {loadError}
        </div>
      ) : group ? (
        <>
          <div className="rounded-2xl bg-primary p-6 text-on-primary md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-headline-md font-bold">
                    {group.planName}
                  </h1>
                </div>
                <p className="mt-2 max-w-md text-body-md text-on-primary/80">
                  Manage your family vehicles and subscription details. All members
                  share access to unlimited washes.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center">
                <p className="text-label-sm uppercase tracking-wider text-on-primary/70">
                  Slots Used
                </p>
                <p className="font-heading text-headline-md font-bold">
                  {group.members.length}
                  <span className="text-body-md font-normal text-on-primary/70">
                    /{group.maxVehicleCount}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="mt-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
              {actionError}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-heading text-headline-md text-on-surface">Members</h2>
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setIsAddOpen(true);
              }}
              disabled={isFull}
              title={isFull ? "This family group is full." : undefined}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-label-md font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus size={15} />
              Add Member
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {group.members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onOpen={() => {
                  setModalError(null);
                  setOpenMemberId(member.id);
                }}
              />
            ))}

            {!isFull && (
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setIsAddOpen(true);
                }}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-outline-variant py-6 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-surface-container">
                  <Plus size={18} />
                </span>
                <span className="text-body-md font-semibold">Add Member</span>
                <span className="text-label-sm">
                  {group.maxVehicleCount - group.members.length} slot
                  {group.maxVehicleCount - group.members.length > 1 ? "s" : ""} remaining
                </span>
              </button>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/subscription")}
              className="text-label-md font-semibold text-primary hover:opacity-80"
            >
              &larr; Back to My Subscriptions
            </button>

            {/* BL-AC-21: chỉ owner giải tán được nhóm - trang này chỉ owner vào được
                (qua "Manage Family" trên gói của chính họ) nên luôn hiện cho owner */}
            <button
              type="button"
              onClick={() => setIsDissolveOpen(true)}
              className="flex items-center gap-1.5 text-label-md font-semibold text-error hover:opacity-80"
            >
              <Trash2 size={14} />
              Dissolve Group
            </button>
          </div>
        </>
      ) : null}

      {openMember && (
        <MemberDetailsModal
          member={openMember}
          onClose={() => setOpenMemberId(null)}
          onUpdateVehicle={() => setVehicleEditMemberId(openMember.id)}
          onRemove={() => setMemberToRemove(openMember)}
        />
      )}

      {vehicleEditMember && (
        <UpdateVehicleModal
          member={vehicleEditMember}
          isSaving={isSaving}
          errorMessage={modalError}
          onClose={() => setVehicleEditMemberId(null)}
          onSave={handleUpdateVehicle}
        />
      )}

      {isAddOpen && (
        <AddMemberModal
          isSaving={isSaving}
          errorMessage={modalError}
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAddMember}
        />
      )}

      {/* Remove confirm - dùng Modal variant="danger" có sẵn, khớp copy trong prototype */}
      <Modal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        variant="danger"
        title="Remove Member?"
        message={
          <>
            Are you sure you want to remove{" "}
            <span className="font-semibold">{memberToRemove?.name}</span> from your
            family group? They will lose access to the membership plan immediately.
          </>
        }
        confirmText="Remove"
        onConfirm={handleConfirmRemove}
        isConfirmLoading={isSaving}
      />

      {/* BL-AC-21 confirm - giải tán nhóm huỷ toàn bộ liên kết thành viên, không huỷ chính
          Subscription (gói vẫn giữ nguyên trạng thái/ngày hết hạn của nó) */}
      <Modal
        isOpen={isDissolveOpen}
        onClose={() => setIsDissolveOpen(false)}
        variant="danger"
        title="Dissolve Family Group?"
        message="Are you sure you want to dissolve this family group? All members will lose access immediately and this cannot be undone."
        confirmText="Dissolve Group"
        onConfirm={handleConfirmDissolve}
        isConfirmLoading={isDissolving}
      />
    </div>
  );
}

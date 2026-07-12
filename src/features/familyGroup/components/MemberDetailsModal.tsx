import { Car, Mail, Phone, Trash2, UserRound } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import type { GroupMemberDto } from "../types/familyGroup";

// Popup chi tiết 1 thành viên - bấm vào hàng tên+xe trong danh sách để mở, theo đúng mẫu
// thiết kế cũ (MemberRow + MemberDetailsModal) - hàng danh sách chỉ hiện tên + xe, còn
// email/phone/nút xóa dồn hết vào đây.
export default function MemberDetailsModal({
  member,
  canRemove,
  onClose,
  onRemove,
}: {
  member: GroupMemberDto;
  canRemove: boolean;
  onClose: () => void;
  onRemove: () => void;
}) {
  return (
    <Modal isOpen onClose={onClose} variant="custom">
      <div className="flex w-full flex-col items-center gap-1">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <UserRound size={32} className="text-primary" />
        </div>
        <p className="mt-2 font-heading text-body-lg font-bold text-on-surface">
          {member.fullName}
        </p>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-label-sm font-bold text-primary">
          {member.roleInGroup}
        </span>
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
            <p className="text-label-sm text-on-surface-variant">Vehicle</p>
            <p className="truncate text-body-md font-semibold text-on-surface">
              {member.linkedVehicle
                ? `${member.linkedVehicle.licensePlate} · ${member.linkedVehicle.brandName}`
                : "No vehicle linked"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col gap-2.5">
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-error/40 px-6 py-3 text-body-md font-semibold text-error hover:bg-error-container"
          >
            <Trash2 size={15} />
            Remove from Group
          </button>
        ) : (
          member.roleInGroup === "OWNER" && (
            <p className="py-2 text-center text-label-md font-semibold text-on-surface-variant">
              Cannot remove Owner
            </p>
          )
        )}
      </div>
    </Modal>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Car, LogOut, Plus, Trash2, UserPlus } from "lucide-react";
import Loading from "../../../components/ui/Loading";
import Modal from "../../../components/ui/Modal";
import { formatDate, formatDateTime } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { useAuth } from "../../../hooks/useAuth";
import { dissolveFamilyGroup, getMyFamilyGroup, removeMember } from "../api/familyGroupApi";
import type { FamilyGroupDetails, GroupMemberDto } from "../types/familyGroup";
import { getFamilyGroupErrorMessage } from "../utils/familyGroupErrorMessages";
import AddMemberModal from "../components/AddMemberModal";
import MemberDetailsModal from "../components/MemberDetailsModal";
import {
  cancelFamilySubscription,
  getFamilySubscriptionPlans,
  renewFamilySubscription,
} from "../../subscriptionPlans/familySubscription/api/familySubscriptionApi";

// "SLOTS USED x/y" ở banner - usageSummary BE trả sẵn dạng chuỗi "3/5", parse ra số để
// vừa hiện to (Slots Used) vừa tính số chỗ trống còn lại cho ô "Add" cuối danh sách.
function parseUsageSummary(usageSummary: string): { used: number; total: number } | null {
  const match = usageSummary.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  return { used: Number(match[1]), total: Number(match[2]) };
}

// planName thật dạng "Family Premium 3 Months" (data.sql) - tách số tháng ra để hiện badge
// "3-Month Plan" trên banner giống mockup, không bịa field durationDays mới ở FE.
function parsePlanDurationLabel(planName: string): string | null {
  const match = planName.match(/(\d+)\s*Months?/i);
  if (!match) return null;
  return `${match[1]}-Month Plan`;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

// AC08: điểm đến sau khi tạo Family Group thành công - hiện danh sách thành viên + nút "Buy
// Family Plan" (task khác, chưa nối logic) và "Invite Member" (API-17-02, chỉ owner thấy được).
export default function FamilyGroupDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [group, setGroup] = useState<FamilyGroupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(
    () =>
      (location.state as { successMessage?: string } | null)?.successMessage ?? null,
  );
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [openMemberId, setOpenMemberId] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberDto | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isDissolveOpen, setIsDissolveOpen] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [dissolveError, setDissolveError] = useState<string | null>(null);

  // subscriptionPlanId của gói hiện tại - GroupSubscriptionDto (từ /my-group) không có field
  // này, phải lấy riêng từ GET /api/subscriptions/family/plans (currentGroup.subscription) để
  // biết chính xác renew đúng gói nào khi bấm "Renew".
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [isCancelSubOpen, setIsCancelSubOpen] = useState(false);
  const [isCancelingSub, setIsCancelingSub] = useState(false);
  const [cancelSubError, setCancelSubError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    window.history.replaceState({}, "");
    const timer = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getMyFamilyGroup()
      .then(setGroup)
      .catch(() => setError("Unable to load your family group. Please try again."))
      .finally(() => setIsLoading(false));
    // Best-effort - không chặn hiển thị trang chính nếu lỗi, chỉ ảnh hưởng nút Renew
    getFamilySubscriptionPlans()
      .then((res) =>
        setCurrentPlanId(res.data.currentGroup?.subscription?.subscriptionPlanId ?? null),
      )
      .catch(() => setCurrentPlanId(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // AC09: thêm thành công -> đóng modal, toast, tự refresh lại danh sách thành viên.
  const handleMemberAdded = (memberName: string) => {
    setIsAddMemberOpen(false);
    setToast(`Added ${memberName} to the group successfully!`);
    load();
  };

  // Remove Member AC04/AC05: xóa cứng thành công -> đóng dialog, toast, refresh danh sách +
  // hạn mức. Lỗi (vd VEHICLE_005 xe đang có booking dở dang) hiện ngay trong dialog, không
  // đóng để owner có thể đọc rồi tự Cancel.
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    setRemoveError(null);
    try {
      await removeMember(memberToRemove.customerId);
      setMemberToRemove(null);
      setOpenMemberId(null);
      setToast(`Removed ${memberToRemove.fullName} from the group successfully.`);
      load();
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setRemoveError(getFamilyGroupErrorMessage(errorCode, message));
    } finally {
      setIsRemoving(false);
    }
  };

  // API-17-03 AC03/AC05: giải tán nhóm thành công -> đóng dialog, toast, group=null nên UI tự
  // rơi về màn hình trống ("You don't have a family group yet.") mà không cần navigate thủ công.
  const handleConfirmDissolve = async () => {
    setIsDissolving(true);
    setDissolveError(null);
    try {
      await dissolveFamilyGroup();
      setIsDissolveOpen(false);
      setGroup(null);
      setToast("Your family group has been dissolved.");
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setDissolveError(getFamilyGroupErrorMessage(errorCode, message));
    } finally {
      setIsDissolving(false);
    }
  };

  // Gia hạn đúng gói hiện tại - thành công thì sang màn thanh toán QR dùng chung với Unlimited
  const handleRenew = async () => {
    if (currentPlanId == null) return;
    setIsRenewing(true);
    setRenewError(null);
    try {
      const result = await renewFamilySubscription({ subscriptionPlanId: currentPlanId });
      navigate(`/subscription-plans/payment/${result.invoiceId}`, {
        state: {
          isRenewal: true,
          redirectTo: "/family",
        },
      });
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setRenewError(getFamilyGroupErrorMessage(errorCode, message));
    } finally {
      setIsRenewing(false);
    }
  };

  // Hủy gói Family đang ACTIVE - hiện được mọi lúc trong lúc gói còn active, không phụ thuộc
  // số ngày còn lại (khác với Renew/Buy New Plan chỉ hiện khi sắp/đã hết hạn).
  const handleConfirmCancelSub = async () => {
    setIsCancelingSub(true);
    setCancelSubError(null);
    try {
      await cancelFamilySubscription();
      setIsCancelSubOpen(false);
      setToast("Your family subscription has been canceled.");
      load();
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setCancelSubError(getFamilyGroupErrorMessage(errorCode, message));
    } finally {
      setIsCancelingSub(false);
    }
  };

  const daysLeft = group?.subscription
    ? Math.ceil(
        (new Date(group.subscription.endDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const showRenewOptions =
    !!group?.subscription &&
    (group.subscription.status !== "ACTIVE" || (daysLeft !== null && daysLeft <= 3));
  const showCancelPlan = group?.subscription?.status === "ACTIVE";

  const openMember = group?.members.find((m) => m.customerId === openMemberId) ?? null;

  // usageSummary ("3/5") -> số slot đã dùng/tổng, dùng cho box "SLOTS USED" ở banner và
  // để tính số chỗ trống còn lại cho ô "Add" cuối danh sách thành viên.
  const usage = group?.subscription ? parseUsageSummary(group.subscription.usageSummary) : null;
  const slotsRemaining = usage ? usage.total - usage.used : null;
  // Không có subscription thì chưa biết hạn mức thật - vẫn cho owner bấm Add (giữ đúng
  // hành vi cũ của nút Invite Member, chỉ ẩn ô Add khi ĐÃ biết chắc hết slot).
  const canShowAddTile = !!group?.owner && (slotsRemaining === null || slotsRemaining > 0);
  const planDurationLabel = group?.subscription
    ? parsePlanDurationLabel(group.subscription.planName)
    : null;

  return (
    <div className="max-w-[1200px] mx-auto px-margin-mobile py-12 md:px-margin-desktop">
      <Modal
        isOpen={!!toast}
        onClose={() => setToast(null)}
        variant="success"
        title="Success"
        message={toast}
      />

      {(isLoading || error || group === null) && (
        <h1 className="font-heading text-headline-lg text-on-surface">
          My Family Group
        </h1>
      )}

      <div className={isLoading || error || group === null ? "mt-6" : ""}>
        {isLoading ? (
          <Loading rows={3} />
        ) : error ? (
          <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        ) : group === null ? (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-12 text-center">
            <p className="text-body-md text-on-surface-variant">
              You don't have a family group yet.
            </p>
            <button
              type="button"
              onClick={() => navigate("/family/create")}
              className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90"
            >
              Create Family Group
            </button>
          </div>
        ) : (
          <>
            {/* Banner hero - tên nhóm/gói + badge kỳ hạn + mô tả bên trái, "SLOTS USED x/y"
                nổi bật bên phải (usageSummary BE trả sẵn, không tính lại ở FE). */}
            <div className="rounded-2xl bg-primary p-6 text-on-primary shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-headline-md font-bold">
                      {group.groupName}
                    </h2>
                    {planDurationLabel && (
                      <span className="rounded-full bg-on-primary/15 px-3 py-1 text-label-sm font-semibold">
                        {planDurationLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-body-md text-on-primary/80">
                    Manage your family vehicles and subscription details. All members
                    share access to unlimited washes.
                  </p>
                  <p className="mt-2 text-label-sm text-on-primary/60">
                    Created {formatDateTime(group.createdAt)}
                    {group.subscription &&
                      ` · Expires ${formatDate(group.subscription.endDate)} · ${group.subscription.status}`}
                  </p>
                </div>

                {usage && (
                  <div className="shrink-0 rounded-xl bg-on-primary/10 px-5 py-3 text-center">
                    <p className="text-label-sm font-bold uppercase tracking-wider text-on-primary/70">
                      Slots Used
                    </p>
                    <p className="mt-1 font-heading text-headline-md font-bold">
                      {usage.used}
                      <span className="text-body-lg font-medium text-on-primary/70">
                        /{usage.total}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action row - Renew/Buy/Cancel plan, tách khỏi banner để banner giữ đúng
                vai trò "hero" thuần thông tin như mockup. */}
            {(!group.subscription || showRenewOptions || showCancelPlan) && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!group.subscription ? (
                  <button
                    type="button"
                    onClick={() => navigate("/subscriptions/family/plans")}
                    className="rounded-lg bg-primary px-4 py-2 text-label-md font-semibold text-on-primary hover:opacity-90"
                  >
                    Buy Family Plan
                  </button>
                ) : (
                  showRenewOptions && (
                    <>
                      <button
                        type="button"
                        onClick={handleRenew}
                        disabled={isRenewing || currentPlanId == null}
                        className="rounded-lg bg-primary px-4 py-2 text-label-md font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRenewing ? "Renewing..." : "Renew"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/subscriptions/family/plans")}
                        className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
                      >
                        Buy New Plan
                      </button>
                    </>
                  )
                )}

                {/* Hủy gói đang active - hiện mọi lúc, không phụ thuộc còn bao nhiêu ngày */}
                {showCancelPlan && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelSubError(null);
                      setIsCancelSubOpen(true);
                    }}
                    className="rounded-lg border border-error/30 px-4 py-2 text-label-md font-semibold text-error hover:bg-error-container"
                  >
                    Cancel Plan
                  </button>
                )}
              </div>
            )}
            {renewError && <p className="mt-2 text-label-sm text-error">{renewError}</p>}

            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-headline-md font-bold text-on-surface">
                  Members
                </h2>
                {/* API-17-02 AC01: chỉ owner mới thêm được thành viên */}
                {group.owner && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90"
                  >
                    <UserPlus size={16} />
                    Add Member
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {/* AC03: Owner luôn ở dòng đầu tiên - tự sort ở FE, không phụ thuộc thứ tự
                    BE trả về (BE có thể đổi thứ tự trong response mà không báo trước). */}
                {[...group.members]
                  .sort((a, b) =>
                    a.roleInGroup === "OWNER" ? -1 : b.roleInGroup === "OWNER" ? 1 : 0,
                  )
                  .map((m) => {
                    const isYou = !!user && user.email.toLowerCase() === m.email.toLowerCase();
                    return (
                      <button
                        key={m.customerId}
                        type="button"
                        onClick={() => setOpenMemberId(m.customerId)}
                        className="flex w-full items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition-colors hover:border-primary/40"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-label-md font-bold text-primary">
                          {getInitials(m.fullName)}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-body-md font-semibold text-on-surface">
                              {m.fullName}
                            </span>
                            {isYou && (
                              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-semibold text-primary">
                                You
                              </span>
                            )}
                          </span>
                          <span className="block text-label-sm text-on-surface-variant">
                            {m.roleInGroup === "OWNER" ? "Owner" : "Member"}
                          </span>
                        </span>

                        {m.linkedVehicle ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-label-sm font-semibold text-on-surface">
                            <Car size={14} />
                            {m.linkedVehicle.licensePlate}
                          </span>
                        ) : (
                          <span className="shrink-0 text-label-sm text-on-surface-variant">
                            No vehicle registered
                          </span>
                        )}
                      </button>
                    );
                  })}

                {/* Ô "Add" cuối danh sách - chỉ hiện cho owner khi còn/chưa rõ hạn mức
                    (canShowAddTile), số slot trống lấy từ usageSummary thật, không bịa. */}
                {canShowAddTile && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant p-8 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-surface-container">
                      <Plus size={18} />
                    </span>
                    <span className="text-body-md font-semibold">Add</span>
                    {slotsRemaining !== null && (
                      <span className="text-label-sm">
                        {slotsRemaining} slot{slotsRemaining > 1 ? "s" : ""} remaining
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* AC04: member (không phải owner) chỉ thấy nút Rời khỏi nhóm, không thấy
                  Add Member hay nút xóa người khác - placeholder, chưa có API rời nhóm. */}
              {!group.owner && (
                <button
                  type="button"
                  disabled
                  className="mt-4 flex items-center gap-1.5 rounded-lg border border-error/30 px-4 py-2 text-label-md font-semibold text-error opacity-50 cursor-not-allowed"
                >
                  <LogOut size={15} />
                  Leave Group
                </button>
              )}
            </div>

            {/* API-17-03 AC01: chỉ owner thấy được, đặt tách riêng khỏi các action chính
                ("góc quản lý nâng cao") để tránh bấm nhầm vào thao tác không thể hoàn tác. */}
            {group.owner && (
              <div className="mt-8 rounded-2xl border border-error/20 bg-error-container/20 p-5">
                <p className="text-label-md font-bold uppercase tracking-wider text-error">
                  Advanced
                </p>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Dissolving the group permanently removes all members and cancels the
                  linked family plan. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDissolveError(null);
                    setIsDissolveOpen(true);
                  }}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-error/40 px-4 py-2 text-label-md font-semibold text-error hover:bg-error-container"
                >
                  <Trash2 size={15} />
                  Dissolve Family Group
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isAddMemberOpen && group && (
        <AddMemberModal
          familyGroupId={group.familyGroupId}
          onClose={() => setIsAddMemberOpen(false)}
          onAdded={handleMemberAdded}
        />
      )}

      {/* Popup chi tiết thành viên - bấm vào hàng tên+xe để mở */}
      {openMember && (
        <MemberDetailsModal
          member={openMember}
          canRemove={!!group?.owner && openMember.roleInGroup === "MEMBER"}
          onClose={() => setOpenMemberId(null)}
          onRemove={() => {
            setRemoveError(null);
            setMemberToRemove(openMember);
            setOpenMemberId(null);
          }}
        />
      )}

      {/* Remove Member AC01: popup xác nhận trước khi xóa cứng */}
      <Modal
        isOpen={!!memberToRemove}
        onClose={() => {
          setMemberToRemove(null);
          setRemoveError(null);
        }}
        variant="danger"
        title="Remove Member?"
        message={
          <>
            Are you sure you want to remove{" "}
            <span className="font-semibold">{memberToRemove?.fullName}</span> from the
            group? Their vehicle will immediately lose all family plan benefits.
            {removeError && (
              <p className="mt-3 text-label-sm text-error">{removeError}</p>
            )}
          </>
        }
        confirmText="Remove"
        onConfirm={handleConfirmRemove}
        isConfirmLoading={isRemoving}
      />

      {/* API-17-03 AC02: cảnh báo nghiêm trọng trước khi giải tán nhóm - nêu rõ hậu quả
          (mất hết member, hủy gói không hoàn tiền, không thể hoàn tác), cùng phong cách với
          cảnh báo hủy subscription ở MySubscriptions.tsx. */}
      <Modal
        isOpen={isDissolveOpen}
        onClose={() => {
          setIsDissolveOpen(false);
          setDissolveError(null);
        }}
        variant="danger"
        title="Dissolve Family Group?"
        message={
          <>
            This will permanently remove all{" "}
            <span className="font-semibold">{group?.members.length ?? 0} member(s)</span>{" "}
            from <span className="font-semibold">{group?.groupName}</span> and cancel its
            linked family plan immediately — no refund. This action cannot be undone.
            {dissolveError && (
              <p className="mt-3 text-label-sm text-error">{dissolveError}</p>
            )}
          </>
        }
        confirmText="Dissolve Group"
        onConfirm={handleConfirmDissolve}
        isConfirmLoading={isDissolving}
      />

      {/* Xác nhận trước khi hủy gói Family đang active - mất quyền lợi ngay lập tức, không
          hoàn tiền (cùng phong cách cảnh báo với Dissolve Family Group ở trên). */}
      <Modal
        isOpen={isCancelSubOpen}
        onClose={() => {
          setIsCancelSubOpen(false);
          setCancelSubError(null);
        }}
        variant="danger"
        title="Cancel Family Plan?"
        message={
          <>
            This will cancel your family plan immediately — all members lose their
            benefits right away, and there's no refund for the remaining period. This
            action cannot be undone.
            {cancelSubError && (
              <p className="mt-3 text-label-sm text-error">{cancelSubError}</p>
            )}
          </>
        }
        confirmText="Cancel Plan"
        onConfirm={handleConfirmCancelSub}
        isConfirmLoading={isCancelingSub}
      />
    </div>
  );
}

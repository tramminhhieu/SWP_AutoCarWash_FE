import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Car, Crown } from "lucide-react";
import Loading from "../../../components/ui/Loading";
import Modal from "../../../components/ui/Modal";
import { formatDate, formatDateTime } from "../../../utils";
import { getMyFamilyGroup } from "../api/familyGroupApi";
import type { FamilyGroupDetails } from "../types/familyGroup";
import AddMemberModal from "../components/AddMemberModal";

// AC08: điểm đến sau khi tạo Family Group thành công - hiện danh sách thành viên + nút "Buy
// Family Plan" (task khác, chưa nối logic) và "Invite Member" (API-17-02, chỉ owner thấy được).
export default function FamilyGroupDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  const [group, setGroup] = useState<FamilyGroupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(
    () =>
      (location.state as { successMessage?: string } | null)?.successMessage ?? null,
  );
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

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

  return (
    <div className="max-w-page mx-auto px-margin-mobile py-12 md:px-margin-desktop">
      <Modal
        isOpen={!!toast}
        onClose={() => setToast(null)}
        variant="success"
        title="Success"
        message={toast}
      />

      <h1 className="font-heading text-headline-lg text-on-surface">
        My Family Group
      </h1>

      <div className="mt-6">
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
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-body-lg font-bold text-on-surface">
                    {group.groupName}
                  </h2>
                  <p className="mt-0.5 text-body-md text-on-surface-variant">
                    Created {formatDateTime(group.createdAt)}
                  </p>
                </div>
                {group.isOwner && (
                  <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-label-sm font-bold uppercase tracking-wider text-primary">
                    <Crown size={12} />
                    Owner
                  </span>
                )}
              </div>

              {group.subscription && (
                <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container p-3">
                  <p className="text-body-md font-semibold text-on-surface">
                    {group.subscription.planName} · {group.subscription.status}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    Expires {formatDate(group.subscription.endDate)} ·{" "}
                    {group.subscription.usageSummary} members
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3 border-t border-outline-variant pt-4">
                {/* Mua gói Family - task khác, chưa nối logic */}
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg bg-primary px-4 py-2 text-label-md font-semibold text-on-primary opacity-50"
                >
                  Buy Family Plan
                </button>
                {/* API-17-02 AC01: chỉ owner mới thêm được thành viên */}
                {group.isOwner && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
                  >
                    Invite Member
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-label-md text-on-surface-variant">
                Members ({group.members.length})
              </p>
              <div className="flex flex-col gap-2.5">
                {group.members.map((m) => (
                  <div
                    key={m.customerId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-body-md font-semibold text-on-surface">
                          {m.fullName}
                        </p>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary">
                          {m.roleInGroup}
                        </span>
                      </div>
                      <p className="text-label-sm text-on-surface-variant">
                        {m.email} · {m.phone}
                      </p>
                    </div>

                    {m.linkedVehicle ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-label-sm font-semibold text-on-surface">
                        <Car size={14} />
                        {m.linkedVehicle.licensePlate}
                      </span>
                    ) : (
                      <span className="shrink-0 text-label-sm text-on-surface-variant">
                        No vehicle linked
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
    </div>
  );
}

import { getApiErrorInfo } from "../../../lib/axiosClient";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Clock, Pencil, Trash2, Plus } from "lucide-react";
import { getAllAddonServices, deleteAddonService } from "../api/addonApi";
import type { AddonService } from "../types/addon";
import { useAuth } from "../../../hooks/useAuth";
import { formatCurrency } from "../../../utils/format";
import Modal from "../../../components/ui/Modal";

/* ================================================================
   Sub-component: 1 card hiển thị add-on
   Admin thấy nút Edit/Delete, Customer chỉ xem.
   ================================================================ */
const AddonCard = ({
  addon,
  isAdmin,
  onEdit,
  onDelete,
}: {
  addon: AddonService;
  isAdmin: boolean;
  onEdit: (addon: AddonService) => void;
  onDelete: (addon: AddonService) => void;
}) => (
  <div className="group relative flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-shadow hover:shadow-[0_10px_25px_-5px_rgba(29,78,216,0.10)]">
    {/* Header: icon + tên */}
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-secondary">
        <Sparkles size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-body-lg font-semibold text-on-surface">
          {addon.name}
        </h3>
        <p className="mt-0.5 text-body-md text-on-surface-variant line-clamp-2">
          {addon.description ?? "No description"}
        </p>
      </div>
    </div>

    {/* Thông tin: giá + thời lượng */}
    <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
      <span className="text-headline-md text-primary">
        {formatCurrency(addon.price)}
      </span>
      <span className="flex items-center gap-1 text-body-md text-on-surface-variant">
        <Clock size={14} />
        {addon.durationMinutes} min
      </span>
    </div>

    {/* Nút admin — chỉ hiện khi role ADMIN */}
    {isAdmin && (
      <div className="mt-3 flex items-center gap-2 border-t border-outline-variant pt-3">
        <button
          type="button"
          onClick={() => onDelete(addon)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-error/30 px-3 py-2 text-body-md font-medium text-error transition-colors hover:bg-error-container"
        >
          <Trash2 size={14} />
          Delete
        </button>
        <button
          type="button"
          onClick={() => onEdit(addon)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-outline-variant px-3 py-2 text-body-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>
    )}
  </div>
);

/* ================================================================
   Sub-component: Skeleton card khi đang loading
   ================================================================ */
const SkeletonCard = () => (
  <div className="flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-container-high" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-3/5 animate-pulse rounded bg-surface-container-high" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-container-high" />
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
      <div className="h-6 w-24 animate-pulse rounded bg-surface-container-high" />
      <div className="h-4 w-16 animate-pulse rounded bg-surface-container-high" />
    </div>
  </div>
);

/* ================================================================
   Page chính: AddonList
   ================================================================ */
export default function AddonList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN";

  const [addons, setAddons] = useState<AddonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(
    () =>
      (location.state as { successMessage?: string })?.successMessage ?? null,
  );
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    window.history.replaceState({}, "");
    const timer = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllAddonServices();
        if (cancelled) return;
        setAddons(data);
      } catch {
        if (cancelled) return;
        setError("Unable to load add-on list. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Navigate sang trang edit, truyền addon data qua state (KHÔNG gọi API mới — AC-15.2) */
  const handleEdit = (addon: AddonService) => {
    navigate(`/admin/add-ons/edit/${addon.id}`, { state: { addon } });
  };

  /* State cho confirm dialog */
  const [deleteTarget, setDeleteTarget] = useState<AddonService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* Bấm Delete trên card → mở confirm dialog */
  const handleDelete = (addon: AddonService) => {
    setDeleteTarget(addon);
  };

  /* Xác nhận xoá → gọi API */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAddonService(deleteTarget.id);
      /* Xoá khỏi list local, không cần refetch */
      setAddons((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setToast("Addon service deleted successfully");
    } catch (error) {
      /* SERVICE_003: addon đang được service_package dùng → hiện message từ BE */
      const { message } = getApiErrorInfo(error);
      setToast(null);
      setErrorToast(message ?? "Unable to delete addon. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-container-max px-4 py-20 md:px-12">
      {/* Thông báo thành công */}
      <Modal
        isOpen={!!toast}
        onClose={() => setToast(null)}
        variant="success"
        title="Success"
        message={toast}
      />

      {/* Lỗi khi xoá (SERVICE_003, SERVICE_001...) */}
      <Modal
        isOpen={!!errorToast}
        onClose={() => setErrorToast(null)}
        variant="danger"
        title="Unable to Delete"
        message={errorToast ?? ""}
        confirmText="Got it"
        onConfirm={() => setErrorToast(null)}
      />

      {/* Confirm dialog xoá */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        variant="danger"
        title="Delete Add-on?"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-on-surface">{deleteTarget?.name}</strong>?
            This action cannot be undone.
          </>
        }
        onConfirm={confirmDelete}
        isConfirmLoading={isDeleting}
      />

      {/* Header — Admin có  Add New, Customer chỉ title */}
      <div className="text-center">
        <h1 className="font-heading text-headline-lg text-on-surface">
          Add-on Services
        </h1>
        <p className="mt-3 font-body text-body-md text-on-surface-variant">
          {isAdmin
            ? "Manage all add-on services in the system"
            : "Extra services to elevate your car wash experience"}
        </p>
      </div>

      {/* Nút thêm mới — chỉ hiện cho Admin */}
      {isAdmin && (
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          {/* Nút Add New */}
          <button
            type="button"
            onClick={() => navigate("/admin/add-ons/create")}
            className="flex shrink-0 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-colors hover:bg-primary/90"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add New
          </button>
        </div>
      )}

      {/* Nội dung chính */}
      <div className={isAdmin ? "mt-8" : "mt-12"}>
        {error ? (
          /* ---- Error state ---- */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-error/20 bg-error-container/10 px-6 py-16 text-center">
            <p className="text-body-lg font-medium text-error">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md border border-error/30 px-4 py-2 text-body-md font-medium text-error transition-colors hover:bg-error-container"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          /* ---- Loading skeleton ---- */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : addons.length === 0 ? (
          /* ---- Empty state ---- */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
            <Sparkles size={40} className="text-on-surface-variant/40" />
            <p className="mt-4 text-body-lg font-medium text-on-surface">
              No add-on services available
            </p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {isAdmin
                ? 'Click "Add New" to create your first add-on service.'
                : "No add-on services available yet. Please check back later."}
            </p>
          </div>
        ) : (
          /* ---- Card grid ---- */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

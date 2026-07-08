import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { formatCurrency } from "../../../utils";
import {
  getAll,
  getAllAddonServices,
  deleteServicePackage,
} from "../api/servicePackageApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import type { ServicePackage, AddonService } from "../types/servicePackage";
import Modal from "../../../components/ui/Modal";

/* ================================================================
   Sub-component: 1 card gói dịch vụ
   Cả Customer và Admin dùng chung logic: addonIds + allAddonServices → ✓/✗
   ================================================================ */
function PackageCard({
  pkg,
  allAddonServices,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: {
  pkg: ServicePackage;
  allAddonServices: AddonService[];
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: (pkg: ServicePackage) => void;
  onDelete: (pkg: ServicePackage) => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-md border border-outline-variant bg-surface-container-lowest p-8 shadow-soft">
      <div className="flex-1">
        <h3 className="font-heading text-headline-md font-bold text-on-surface">
          {pkg.name}
        </h3>
        <p className="mt-2 font-body text-body-md text-on-surface-variant">
          {pkg.description ?? "No description"}
        </p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="font-heading text-headline-md font-bold text-on-surface">
            {formatCurrency(pkg.basePrice)}
          </span>
          <span className="font-body text-body-md text-on-surface-variant">
            /wash
          </span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-surface-container px-3 py-1.5">
          <Clock size={14} className="text-on-surface-variant" />
          <span className="font-body text-label-sm font-medium text-on-surface-variant">
            {pkg.durationMinutes} min
          </span>
        </div>

        {/* Danh sách addon ✓/✗ — dùng chung cả 2 role */}
        {allAddonServices.length > 0 && (
          <ul className="mt-6 space-y-2">
            {allAddonServices.map((addon) => {
              const isIncluded = pkg.addonIds.includes(addon.id);
              return (
                <li key={addon.id} className="flex items-center gap-2.5">
                  {isIncluded ? (
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-tertiary-fixed-dim"
                      strokeWidth={2}
                    />
                  ) : (
                    <XCircle
                      size={16}
                      className="shrink-0 text-error"
                      strokeWidth={2}
                    />
                  )}
                  <span
                    className={
                      isIncluded
                        ? "font-body text-body-sm text-on-surface"
                        : "font-body text-body-sm text-on-surface-variant"
                    }
                  >
                    {addon.name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Button vùng — Customer: Select, Admin: Edit + Delete */}
      {isAdmin ? (
        <div className="mt-8 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDelete(pkg)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-error/30 px-3 py-3 font-body text-sm font-medium text-error transition-colors hover:bg-error-container"
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            type="button"
            onClick={() => onEdit(pkg)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant px-3 py-3 font-body text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="mt-8 w-full rounded-lg bg-primary px-6 py-3 text-center font-body text-sm font-semibold text-on-primary"
        >
          Select {pkg.name}
        </button>
      )}
    </div>
  );
}

/* ================================================================
   Page chính: ServicePackageList
   ================================================================ */
export default function ServicePackageList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  /* Danh sách tất cả addon — cả 2 role đều cần để mapping addonIds → tên */
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Search — client-side filter theo name (AC-14.4.3) */
  const [searchQuery, setSearchQuery] = useState("");

  const [toast, setToast] = useState<string | null>(
    () =>
      (location.state as { successMessage?: string })?.successMessage ?? null,
  );

  useEffect(() => {
    if (!toast) return;
    window.history.replaceState({}, "");
    const timer = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* Fetch packages + addon services song song khi vào trang */
  useEffect(() => {
    let isMounted = true;

    Promise.all([getAll(), getAllAddonServices()])
      .then(([pkgData, addonData]) => {
        if (!isMounted) return;
        setPackages(pkgData);
        setAddonServices(addonData);
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load service packages. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /* Danh sách package sau khi lọc theo search (chỉ Admin mới có search) */
  const filteredPackages = searchQuery.trim()
    ? packages.filter((pkg) =>
        pkg.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : packages;

  /* Customer: bấm Select → bắt đầu luồng đặt lịch */
  function handleSelectPackage() {
    if (isAuthenticated) {
      navigate("/booking/location");
    } else {
      navigate("/login", { state: { from: "/booking/location" } });
    }
  }

  /* Admin: navigate sang trang edit, truyền package data qua state */
  const handleEdit = (pkg: ServicePackage) => {
    navigate(`/admin/service-packages/edit/${pkg.id}`, { state: { pkg } });
  };

  /* Admin: placeholder — thay bằng confirm dialog + API khi có spec delete */
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServicePackage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* Bấm Delete trên card → mở confirm dialog */
  const handleDelete = (pkg: ServicePackage) => {
    setDeleteTarget(pkg);
  };

  /* Xác nhận xoá → gọi API */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteServicePackage(deleteTarget.id);
      setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setToast("Service package deleted successfully");
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setToast(null);
      setErrorToast(message ?? "Unable to delete package. Please try again.");
      setTimeout(() => setErrorToast(null), 4000);
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

      {/* Lỗi khi xoá */}
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

      <div className="text-center">
        <h1 className="font-heading text-headline-lg text-on-surface">
          Service Packages
        </h1>
        <p className="mt-3 font-body text-body-md text-on-surface-variant">
          {isAdmin
            ? "Manage all service packages in the system"
            : "Choose the right level of care for your vehicle."}
        </p>
      </div>

      {/* Admin toolbar: Add New */}
      {isAdmin && (
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin/service-packages/create")}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-colors hover:bg-primary/90"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add New
          </button>
        </div>
      )}

      {/* Nội dung chính */}
      <div className={isAdmin ? "mt-8" : "mt-12"}>
        {error ? (
          <div className="flex h-48 items-center justify-center text-base text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            Loading...
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-base text-outline">
              {searchQuery.trim()
                ? `No packages matching "${searchQuery.trim()}"`
                : "No service packages available."}
            </p>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 text-body-md font-medium text-primary transition-colors hover:text-primary/80"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                allAddonServices={addonServices}
                isAdmin={isAdmin}
                onSelect={handleSelectPackage}
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

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  deleteAdminEmployee,
  getAdminEmployeeDetail,
  getAdminEmployees,
  updateAdminEmployee,
} from "../api/adminEmployeeApi";
import BranchFilterDropdown, {
  type BranchFilterSelection,
} from "../../station/components/BranchFilterDropdown";
import {
  getAllStations,
  type AdminStationOption,
} from "../../adminCustomer/api/adminCustomerBookingApi";
import type {
  AdminEmployeeDetail,
  AdminEmployeeRow,
} from "../types/adminEmployee";
import { formatDateOnly } from "../../booking/utils/bookingFormatters";
import Modal from "../../../components/ui/Modal";
import { getApiErrorInfo } from "../../../lib/axiosClient";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const PHONE_PATTERN = /^0\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// BE trả errorCode chung cho cả app; dịch sang câu nói rõ ngữ cảnh nhân viên.
const SAVE_ERROR_MAP: Record<string, string> = {
  AUTH_001: "This email is already used by another account.",
  AUTH_002: "This phone number is already used by another account.",
  STATION_001: "The selected branch no longer exists.",
};

interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stationId: string;
  active: string;
}

function toForm(detail: AdminEmployeeDetail): EmployeeForm {
  return {
    firstName: detail.firstName ?? "",
    lastName: detail.lastName ?? "",
    email: detail.email ?? "",
    phone: detail.phone ?? "",
    stationId: String(detail.stationId),
    active: detail.accountStatus === "ACTIVE" ? "true" : "false",
  };
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-[0.6px] ${
        active
          ? "border-tertiary-container/30 bg-tertiary-container/10 text-tertiary-container"
          : "border-error/30 bg-error-container text-on-error-container"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-white px-3 py-2 text-sm text-on-surface outline-none transition-colors ${
    error ? "border-error" : "border-outline-variant focus:border-primary"
  }`;
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wide text-on-surface-variant">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="font-heading text-2xl font-semibold text-on-surface">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AdminEmployees() {
  const [rows, setRows] = useState<AdminEmployeeRow[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  // Search bar: gõ tự do, chỉ apply khi bấm Enter/nút search - tránh gọi API
  // mỗi lần gõ phím. appliedKeyword mới là thứ thực sự đưa vào query BE.
  const [searchInput, setSearchInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const [active, setActive] = useState("");

  // Filter theo chi nhánh - chọn dừng ở cấp Province/Commune/Station nào thì
  // lọc nhân viên theo phạm vi cấp đó (không chọn gì = tất cả).
  const [branchFilter, setBranchFilter] = useState<BranchFilterSelection>(null);

  // Modal chi tiết nhân viên - mở khi click 1 row.
  const [viewingEmployeeId, setViewingEmployeeId] = useState<number | null>(
    null,
  );
  const [detail, setDetail] = useState<AdminEmployeeDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Chế độ sửa ngay trong popup: các dòng thông tin biến thành input.
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EmployeeForm | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Danh sách chi nhánh cho dropdown khi sửa.
  const [stations, setStations] = useState<AdminStationOption[]>([]);

  // Tăng lên mỗi lần cần buộc list fetch lại (sau khi sửa/xoá) dù filter/page không đổi.
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRowClick(employeeId: number) {
    setViewingEmployeeId(employeeId);
    setDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);
    setIsEditing(false);
  }

  function closeDetailModal() {
    setViewingEmployeeId(null);
    setIsEditing(false);
    setConfirmingDelete(false);
  }

  function startEditing() {
    if (!detail) return;
    setForm(toForm(detail));
    setFieldErrors({});
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setFieldErrors({});
    setSaveError(null);
  }

  function updateField(key: keyof EmployeeForm, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    // Xoá lỗi của đúng field đang gõ để thông báo không dính lại sau khi đã sửa.
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateForm(current: EmployeeForm): boolean {
    const errors: Record<string, string> = {};
    if (!current.firstName.trim()) errors.firstName = "First name is required.";
    if (!current.lastName.trim()) errors.lastName = "Last name is required.";
    if (!EMAIL_PATTERN.test(current.email.trim()))
      errors.email = "Enter a valid email address.";
    if (!PHONE_PATTERN.test(current.phone.trim()))
      errors.phone = "Phone must be 10 digits and start with 0.";
    if (!current.stationId) errors.stationId = "Branch is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSave() {
    if (viewingEmployeeId == null || !form) return;
    setSaveError(null);
    if (!validateForm(form)) return;

    setIsSaving(true);
    updateAdminEmployee(viewingEmployeeId, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      stationId: Number(form.stationId),
      active: form.active === "true",
    })
      .then((updated) => {
        setDetail(updated);
        setIsEditing(false);
        // Tên/chi nhánh/trạng thái có thể đã đổi -> làm mới bảng phía sau.
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => {
        const { errorCode, message } = getApiErrorInfo(err);
        setSaveError(
          SAVE_ERROR_MAP[errorCode ?? ""] ??
            message ??
            "Could not save this employee. Please try again.",
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  function handleDeleteConfirmed() {
    if (viewingEmployeeId == null) return;
    setIsDeleting(true);
    setDeleteError(null);
    deleteAdminEmployee(viewingEmployeeId)
      .then(() => {
        closeDetailModal();
        setIsLoading(true);
        setError(null);
        setRefreshKey((k) => k + 1);
      })
      .catch(() => {
        setDeleteError("Could not delete this employee. Please try again.");
      })
      .finally(() => {
        setIsDeleting(false);
      });
  }

  function handleSearchSubmit() {
    setAppliedKeyword(searchInput.trim());
    setPage(1);
    setIsLoading(true);
    setError(null);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setIsLoading(true);
    setError(null);
  }

  function handleFilterChange(update: () => void) {
    update();
    setPage(1);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let isMounted = true;

    getAdminEmployees({
      page: page - 1,
      size: PAGE_SIZE,
      keyword: appliedKeyword || undefined,
      active: active === "" ? undefined : active === "true",
      provinceId: branchFilter?.level === "province" ? branchFilter.id : undefined,
      communeId: branchFilter?.level === "commune" ? branchFilter.id : undefined,
      stationId: branchFilter?.level === "station" ? branchFilter.id : undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        setRows(res.content);
        setTotalEmployees(res.summary.totalEmployees);
        setNewThisMonth(res.summary.newThisMonth);
        setTotalPages(Math.max(1, res.totalPages));
      })
      .catch(() => {
        if (isMounted)
          setError("Could not load the employee list. Please try again later.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, appliedKeyword, active, branchFilter, refreshKey]);

  // Danh sách chi nhánh cho dropdown khi sửa - load 1 lần.
  useEffect(() => {
    let isMounted = true;
    getAllStations()
      .then((res) => {
        if (isMounted) setStations(res);
      })
      .catch(() => {
        // Không chặn cả trang nếu load chi nhánh lỗi - chỉ dropdown khi sửa mất lựa chọn.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch chi tiết nhân viên khi mở modal.
  useEffect(() => {
    if (viewingEmployeeId == null) return;
    let isMounted = true;

    getAdminEmployeeDetail(viewingEmployeeId)
      .then((res) => {
        if (isMounted) setDetail(res);
      })
      .catch(() => {
        if (isMounted)
          setDetailError(
            "Could not load employee details. Please try again later.",
          );
      })
      .finally(() => {
        if (isMounted) setIsDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [viewingEmployeeId]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
          Employee Management
        </h1>
        <p className="text-sm text-on-surface-variant">
          View your registered employee accounts.
        </p>
      </div>

      {/* ─── KPI summary ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <KpiCard
          icon={Users}
          label="Total Employees"
          value={totalEmployees.toLocaleString()}
        />
        <KpiCard
          icon={UserPlus}
          label="New This Month"
          value={newThisMonth.toLocaleString()}
        />
      </div>

      {/* ─── Search bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearchSubmit();
          }}
          placeholder="Search by name, email, or phone"
          className="w-72 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        />
        <button
          type="button"
          onClick={handleSearchSubmit}
          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface"
        >
          <Search className="size-4" />
          Search
        </button>
      </div>

      {/* ─── Filter bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={active}
            onChange={(e) =>
              handleFilterChange(() => setActive(e.target.value))
            }
            className="appearance-none rounded-lg border border-outline-variant bg-white py-2 pl-3 pr-9 text-sm font-medium text-on-surface"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        </div>
        <BranchFilterDropdown
          onChange={(sel) => handleFilterChange(() => setBranchFilter(sel))}
        />
      </div>

      {/* ─── Table ────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {error ? (
          <div className="flex h-48 items-center justify-center text-base text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            No employees found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="whitespace-nowrap px-3 py-4 text-left text-sm font-medium uppercase text-on-surface-variant">
                    ID
                  </th>
                  <th className="whitespace-nowrap px-3 py-4 text-left text-sm font-medium uppercase text-on-surface-variant">
                    Full Name
                  </th>
                  <th className="whitespace-nowrap px-3 py-4 text-left text-sm font-medium uppercase text-on-surface-variant">
                    Email
                  </th>
                  <th className="whitespace-nowrap px-3 py-4 text-left text-sm font-medium uppercase text-on-surface-variant">
                    Phone
                  </th>
                  <th className="whitespace-nowrap px-3 py-4 text-left text-sm font-medium uppercase text-on-surface-variant">
                    Branch
                  </th>
                  <th className="whitespace-nowrap px-3 py-4 text-left text-sm font-medium uppercase text-on-surface-variant">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-3 py-4 text-left text-sm font-medium uppercase text-on-surface-variant">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.employeeId}
                    onClick={() => handleRowClick(row.employeeId)}
                    className={`cursor-pointer hover:bg-surface-container-low ${
                      i > 0 ? "border-t border-outline-variant" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-on-surface">
                      {row.employeeCode}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-on-surface">
                      {row.fullName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-on-surface">
                      {row.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-on-surface">
                      {row.phone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-on-surface">
                      {row.stationName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <StatusPill active={row.active} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-on-surface">
                      {formatDateOnly(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-primary text-white"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, page + 1))
                  }
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={viewingEmployeeId != null}
        onClose={closeDetailModal}
        variant="custom"
        size="lg"
      >
        <div className="flex w-full flex-col gap-6 text-left text-sm">
          {isDetailLoading ? (
            <div className="flex h-32 items-center justify-center text-base text-outline">
              Loading...
            </div>
          ) : detailError ? (
            <div className="flex h-32 items-center justify-center text-base text-error">
              {detailError}
            </div>
          ) : (
            detail && (
              <>
                <div className="flex items-center gap-4 border-b border-outline-variant pb-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xl font-bold text-on-primary-fixed">
                    {detail.fullName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-headline-md font-semibold text-on-surface">
                      {detail.fullName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      ID: {detail.employeeCode}
                    </p>
                  </div>
                </div>

                {isEditing && form ? (
                  <div className="flex flex-col gap-4">
                    {saveError && (
                      <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-on-error-container">
                        {saveError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="First Name" error={fieldErrors.firstName}>
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={(e) => updateField("firstName", e.target.value)}
                          className={inputClass(fieldErrors.firstName)}
                        />
                      </FormField>
                      <FormField label="Last Name" error={fieldErrors.lastName}>
                        <input
                          type="text"
                          value={form.lastName}
                          onChange={(e) => updateField("lastName", e.target.value)}
                          className={inputClass(fieldErrors.lastName)}
                        />
                      </FormField>
                      <FormField label="Email" error={fieldErrors.email}>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className={inputClass(fieldErrors.email)}
                        />
                      </FormField>
                      <FormField label="Phone" error={fieldErrors.phone}>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className={inputClass(fieldErrors.phone)}
                        />
                      </FormField>
                      <FormField label="Branch" error={fieldErrors.stationId}>
                        <div className="relative">
                          <select
                            value={form.stationId}
                            onChange={(e) =>
                              updateField("stationId", e.target.value)
                            }
                            className={`${inputClass(fieldErrors.stationId)} appearance-none pr-9`}
                          >
                            {stations.map((s) => (
                              <option key={s.id} value={String(s.id)}>
                                {s.stationName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                        </div>
                      </FormField>
                      <FormField label="Account Status">
                        <div className="relative">
                          <select
                            value={form.active}
                            onChange={(e) => updateField("active", e.target.value)}
                            className={`${inputClass()} appearance-none pr-9`}
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                        </div>
                      </FormField>
                    </div>

                    <div className="flex justify-between border-t border-outline-variant pt-4">
                      <span className="text-on-surface-variant">
                        Created Date
                      </span>
                      <span className="font-semibold text-on-surface">
                        {formatDateOnly(detail.createdAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 rounded-lg border border-outline-variant p-4">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Email</span>
                      <span className="font-semibold text-on-surface">
                        {detail.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Phone</span>
                      <span className="font-semibold text-on-surface">
                        {detail.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Branch</span>
                      <span className="font-semibold text-on-surface">
                        {detail.stationName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">
                        Account Status
                      </span>
                      <StatusPill active={detail.accountStatus === "ACTIVE"} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">
                        Created Date
                      </span>
                      <span className="font-semibold text-on-surface">
                        {formatDateOnly(detail.createdAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer bar - -mx-8 -mb-8 để triệt tiêu padding của Modal, cho
                    thanh nút dính sát mép dưới popup. */}
                <div className="-mx-8 -mb-8 flex items-center justify-between rounded-b-2xl border-t border-outline-variant bg-surface-container-low px-8 py-4">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
                      >
                        <Save className="size-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startEditing}
                        className="flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
                      >
                        <Pencil className="size-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setConfirmingDelete(true);
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg bg-error px-6 py-3 text-sm font-semibold text-on-error hover:opacity-90"
                      >
                        <Trash2 className="size-4" />
                        Delete Employee
                      </button>
                    </>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </Modal>

      {/* Đặt sau modal chi tiết: Modal không quản z-index, xếp chồng dựa vào
          thứ tự DOM nên modal này mới nằm trên. */}
      <Modal
        isOpen={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        variant="danger"
        title="Delete this employee?"
        message={
          <>
            This action cannot be undone.
            {deleteError && (
              <div className="mt-2 text-xs text-error">{deleteError}</div>
            )}
          </>
        }
        confirmText="Delete"
        onConfirm={handleDeleteConfirmed}
        isConfirmLoading={isDeleting}
      />
    </div>
  );
}

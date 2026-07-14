import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  ChevronLeft,
  ChevronRight,
  History,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  deleteAdminCustomer,
  getAdminCustomerDetail,
  getAdminCustomers,
} from "../api/adminCustomerApi";
import BranchFilterDropdown, {
  type BranchFilterSelection,
} from "../../station/components/BranchFilterDropdown";
import type {
  AdminCustomerDetail,
  AdminCustomerRow,
} from "../types/adminCustomer";
import { formatCheckInTime } from "../../booking/utils/bookingFormatters";
import Modal from "../../../components/ui/Modal";
import { getApiErrorInfo } from "../../../lib/axiosClient";

const PAGE_SIZE = 10;

const TIER_OPTIONS = [
  { value: "", label: "All ranks" },
  { value: "MEMBER", label: "Member" },
  { value: "SILVER", label: "Silver" },
  { value: "GOLD", label: "Gold" },
  { value: "PLATINUM", label: "Platinum" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const MONTH_OPTIONS = [
  { value: "", label: "All months" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Month ${i + 1}`,
  })),
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "", label: "All years" },
  ...Array.from({ length: 6 }, (_, i) => {
    const y = CURRENT_YEAR - i;
    return { value: String(y), label: String(y) };
  }),
];

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

export default function AdminCustomers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const routePrefix = location.pathname.startsWith("/staff") ? "/staff" : "/admin";
  const [rows, setRows] = useState<AdminCustomerRow[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  // Search bar: gõ tự do, chỉ apply khi bấm Enter/nút search - tránh gọi API
  // mỗi lần gõ phím. appliedKeyword mới là thứ thực sự đưa vào query BE.
  const [searchInput, setSearchInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  // Filter theo ngày đăng ký tài khoản (User.createdAt) - KHÔNG phải last visit.
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [tier, setTier] = useState("");
  const [active, setActive] = useState("");

  // Filter theo chi nhánh - chọn dừng ở cấp Province/Commune/Station nào thì
  // lọc khách hàng theo phạm vi cấp đó (không chọn gì = tất cả).
  const [branchFilter, setBranchFilter] = useState<BranchFilterSelection>(null);

  // Modal chi tiết khách hàng - mở khi click 1 row.
  const [viewingCustomerId, setViewingCustomerId] = useState<number | null>(
    null,
  );
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Tăng lên mỗi lần cần buộc list fetch lại (vd sau khi xoá customer) dù các
  // filter/page không đổi.
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRowClick(customerId: number) {
    setViewingCustomerId(customerId);
    setDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);
  }

  function closeDetailModal() {
    setViewingCustomerId(null);
    setConfirmingDelete(false);
  }

  function handleDeleteConfirmed() {
    if (viewingCustomerId == null) return;
    setIsDeleting(true);
    setDeleteError(null);
    deleteAdminCustomer(viewingCustomerId)
      .then(() => {
        closeDetailModal();
        // Load lại trang hiện tại để phản ánh danh sách mới nhất.
        setIsLoading(true);
        setError(null);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => {
        const { errorCode, message } = getApiErrorInfo(err);
        // BE trả message tiếng Việt cho case này (CUSTOMER_006), có kèm theo
        // biển số + trạng thái booking, vd: "Không thể xóa: xe 51A-99288
        // (WASHING) đang có đặt lịch hoạt động". Tách phần biển số/trạng thái
        // (không phải tiếng Việt) ra để dựng câu tiếng Anh, thay vì hiện
        // nguyên văn hoặc mất luôn thông tin xe nào.
        const vehicleDetailMatch = message?.match(
          /^Không thể xóa: xe (.+) đang có đặt lịch hoạt động$/,
        );
        // BE liệt kê theo cặp "biển số (STATUS)" và dedupe trên cả cặp, nên
        // cùng 1 xe có thể lặp lại với status khác nhau - chỉ cần nêu tên xe,
        // bỏ status, dedupe lại theo biển số.
        const plates = vehicleDetailMatch
          ? Array.from(
              new Set(
                vehicleDetailMatch[1]
                  .split(", ")
                  .map((entry) => entry.replace(/\s*\(.+\)$/, "")),
              ),
            )
          : null;
        setDeleteError(
          errorCode === "CUSTOMER_006"
            ? plates
              ? plates.length === 1
                ? `Cannot delete: vehicle ${plates[0]} is currently in a booking process.`
                : `Cannot delete: vehicles ${plates.join(", ")} are currently in a booking process.`
              : "Cannot delete: this customer has an active booking."
            : "Could not delete this customer. Please try again.",
        );
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

    getAdminCustomers({
      page: page - 1,
      size: PAGE_SIZE,
      keyword: appliedKeyword || undefined,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      tier: tier || undefined,
      active: active === "" ? undefined : active === "true",
      provinceId: branchFilter?.level === "province" ? branchFilter.id : undefined,
      communeId: branchFilter?.level === "commune" ? branchFilter.id : undefined,
      stationId: branchFilter?.level === "station" ? branchFilter.id : undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        setRows(res.content);
        setTotalCustomers(res.summary.totalCustomers);
        setNewThisMonth(res.summary.newThisMonth);
        setTotalPages(Math.max(1, res.totalPages));
      })
      .catch(() => {
        if (isMounted)
          setError("Không thể tải danh sách khách hàng. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, appliedKeyword, year, month, tier, active, branchFilter, refreshKey]);

  // Fetch chi tiết khách hàng khi mở modal.
  useEffect(() => {
    if (viewingCustomerId == null) return;
    let isMounted = true;

    getAdminCustomerDetail(viewingCustomerId)
      .then((res) => {
        if (isMounted) setDetail(res);
      })
      .catch(() => {
        if (isMounted)
          setDetailError(
            "Không thể tải chi tiết khách hàng. Vui lòng thử lại sau.",
          );
      })
      .finally(() => {
        if (isMounted) setIsDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [viewingCustomerId]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
          Customer Management
        </h1>
        <p className="text-sm text-on-surface-variant">
          View and manage your registered customer database.
        </p>
      </div>

      {/* ─── KPI summary ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <KpiCard
          icon={Users}
          label="Total Customers"
          value={totalCustomers.toLocaleString()}
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
        <select
          value={year}
          onChange={(e) => handleFilterChange(() => setYear(e.target.value))}
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        >
          {YEAR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => handleFilterChange(() => setMonth(e.target.value))}
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        >
          {MONTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={tier}
          onChange={(e) => handleFilterChange(() => setTier(e.target.value))}
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        >
          {TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={active}
          onChange={(e) => handleFilterChange(() => setActive(e.target.value))}
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isAdmin && (
          <BranchFilterDropdown
            onChange={(sel) => handleFilterChange(() => setBranchFilter(sel))}
          />
        )}
      </div>

      {/* ─── Table ────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {error ? (
          <div className="flex h-48 items-center justify-center text-base text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            Đang tải...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            No customers found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Customer Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Last Visit
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.customerId}
                    onClick={() => handleRowClick(row.customerId)}
                    className={`cursor-pointer hover:bg-surface-container-low ${
                      i > 0 ? "border-t border-outline-variant" : ""
                    }`}
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-sm font-bold text-on-primary-fixed">
                          {row.fullName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-base font-medium text-on-surface">
                            {row.fullName}
                          </p>
                          {row.tier && (
                            <p className="text-xs text-on-surface-variant">
                              {row.tier}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.email}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.phone}
                    </td>
                    <td className="px-6 py-6">
                      <StatusPill active={row.active} />
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {formatCheckInTime(row.lastVisit)}
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
        isOpen={viewingCustomerId != null}
        onClose={closeDetailModal}
        variant="custom"
        size="lg"
      >
        <div className="flex w-full flex-col gap-6 text-left text-sm">
          {isDetailLoading ? (
            <div className="flex h-32 items-center justify-center text-base text-outline">
              Đang tải...
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
                      ID: {detail.customerCode}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* ─── Left column ─────────────────────────────────── */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 rounded-lg border border-outline-variant p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Primary Information
                      </p>
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
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-1 flex-col gap-1 rounded-lg border border-outline-variant p-4">
                        <span className="text-xs text-on-surface-variant">
                          Current Tier
                        </span>
                        <span className="text-lg font-bold text-on-surface">
                          {detail.tier ?? "—"}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-1 rounded-lg border border-outline-variant p-4">
                        <span className="text-xs text-on-surface-variant">
                          Total Points
                        </span>
                        <span className="text-lg font-bold text-on-surface">
                          {detail.totalPoints.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ─── Right column ────────────────────────────────── */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 rounded-lg border border-outline-variant p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Registered Vehicles
                      </p>
                      {detail.vehicles.length === 0 ? (
                        <p className="text-on-surface-variant">
                          No vehicles registered
                        </p>
                      ) : (
                        detail.vehicles.map((v, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between border-t border-outline-variant py-2 first:border-t-0 first:pt-0"
                          >
                            <span className="flex items-center gap-2 text-on-surface">
                              {v.brandName}
                              {v.activeSubscriptionType && (
                                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  {v.activeSubscriptionType}
                                </span>
                              )}
                            </span>
                            <span className="text-on-surface-variant">
                              {v.color} · {v.licensePlate}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col gap-2 rounded-lg border border-outline-variant p-4">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">
                          Account Status
                        </span>
                        <StatusPill
                          active={detail.accountStatus === "ACTIVE"}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">
                          Last Visit
                        </span>
                        <span className="font-semibold text-on-surface">
                          {detail.lastVisit
                            ? formatCheckInTime(detail.lastVisit)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="-mx-8 -mb-8 flex items-center justify-between rounded-b-2xl border-t border-outline-variant bg-surface-container-low px-8 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `${routePrefix}/customers/${detail.customerId}/bookings`,
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
                  >
                    <History className="size-4" />
                    View Booking History
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setConfirmingDelete(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-error px-6 py-3 text-sm font-semibold text-on-error hover:opacity-90"
                    >
                      <Trash2 className="size-4" />
                      Delete Customer
                    </button>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </Modal>

      <Modal
        isOpen={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        variant="danger"
        title="Delete this customer?"
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

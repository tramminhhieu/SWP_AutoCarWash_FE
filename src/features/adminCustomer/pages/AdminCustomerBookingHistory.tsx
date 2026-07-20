import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getCustomerBookingHistory } from "../api/adminCustomerBookingApi";
import { getAdminCustomerDetail } from "../api/adminCustomerApi";
import BranchFilterDropdown, {
  type BranchFilterSelection,
} from "../../station/components/BranchFilterDropdown";
import type { AdminCustomerBookingRow } from "../types/adminCustomerBooking";
import type { BookingStatus } from "../../booking/types/booking";
import BookingStatusBadge from "../../../components/ui/BookingStatusBadge";
import BackButton from "../../../components/ui/BackButton";
import { useAuth } from "../../../hooks/useAuth";
import { BOOKING_STATUS_STYLES } from "../../../constants/bookingStatusStyles";
import { formatAppointmentDate } from "../../booking/utils/bookingFormatters";
import { formatCurrency } from "../../../utils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...(Object.keys(BOOKING_STATUS_STYLES) as BookingStatus[]).map((status) => ({
    value: status,
    label: BOOKING_STATUS_STYLES[status].label,
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

const MONTH_OPTIONS = [
  { value: "", label: "All months" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Month ${i + 1}`,
  })),
];

export default function AdminCustomerBookingHistory() {
  const { customerId } = useParams<{ customerId: string }>();
  const id = Number(customerId);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [customerName, setCustomerName] = useState<string | null>(null);

  const [rows, setRows] = useState<AdminCustomerBookingRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  // Search theo biển số/hãng xe: gõ tự do, chỉ apply khi bấm Enter/nút search.
  const [searchInput, setSearchInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [branchFilter, setBranchFilter] = useState<BranchFilterSelection>(null);

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
    if (!Number.isFinite(id)) return;
    let isMounted = true;

    getAdminCustomerDetail(id)
      .then((res) => {
        if (isMounted) setCustomerName(res.fullName);
      })
      .catch(() => {
        // Không chặn trang nếu chỉ tên khách hàng lỗi - vẫn hiển thị được bảng lịch sử.
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    let isMounted = true;

    getCustomerBookingHistory(id, {
      page: page - 1,
      size: PAGE_SIZE,
      vehicleKeyword: appliedKeyword || undefined,
      status: status ? (status as BookingStatus) : undefined,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      stationId: isAdmin
        ? branchFilter?.level === "station"
          ? branchFilter.id
          : undefined
        : user?.stationId,
      communeId:
        isAdmin && branchFilter?.level === "commune"
          ? branchFilter.id
          : undefined,
      provinceId:
        isAdmin && branchFilter?.level === "province"
          ? branchFilter.id
          : undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        setRows(res.content);
        setTotalPages(Math.max(1, res.totalPages));
      })
      .catch(() => {
        if (isMounted)
          setError("Không thể tải lịch sử đặt lịch. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, page, appliedKeyword, status, year, month, branchFilter, isAdmin, user?.stationId]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <div className="flex items-center gap-4">
        <BackButton />
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Booking History{customerName ? ` — ${customerName}` : ""}
          </h1>
          <p className="text-sm text-on-surface-variant">
            Full booking history for this customer.
          </p>
        </div>
      </div>

      {/* ─── Search bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearchSubmit();
          }}
          placeholder="Search by license plate or brand"
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
        <select
          value={status}
          onChange={(e) =>
            handleFilterChange(() => setStatus(e.target.value))
          }
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
            No bookings found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Booking ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Service Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Vehicle
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Staff
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.bookingId}
                    className={i > 0 ? "border-t border-outline-variant" : ""}
                  >
                    <td className="px-6 py-6 text-base font-medium text-on-surface">
                      #{row.bookingId}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {formatAppointmentDate(row.appointmentDate)}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.serviceCategoryName}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.brandName} · {row.licensePlate}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.staffName ?? "—"}
                    </td>
                    <td className="px-6 py-6">
                      <BookingStatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-6 text-right text-base font-bold text-on-surface">
                      {formatCurrency(row.totalAmount)}
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
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
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
    </div>
  );
}

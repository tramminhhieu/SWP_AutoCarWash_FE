import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import {
  confirmRefund,
  getAdminRefunds,
  getRefundDetail,
} from "../api/refundApi";
import { getAllStations } from "../../adminCustomer/api/adminCustomerBookingApi";
import type { AdminStationOption } from "../../adminCustomer/api/adminCustomerBookingApi";
import type { RefundDetail, RefundListItem, RefundStatus } from "../types/refund";
import Modal from "../../../components/ui/Modal";
import RefundStatusBadge from "../../../components/ui/RefundStatusBadge";
import {
  formatAppointmentDate,
  formatCheckInTime,
  formatCurrency,
} from "../../booking/utils/bookingFormatters";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: RefundStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "REFUNDED", label: "Refunded" },
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

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
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

export default function RefundManagement() {
  const [rows, setRows] = useState<RefundListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalRefundedAmount, setTotalRefundedAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RefundStatus | "">("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [stationId, setStationId] = useState("");
  const [stations, setStations] = useState<AdminStationOption[]>([]);

  // Search bar: gõ tự do, chỉ apply khi bấm Enter/nút search.
  const [searchInput, setSearchInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const [selectedRefundId, setSelectedRefundId] = useState<number | null>(
    null,
  );

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

    getAllStations()
      .then((res) => {
        if (isMounted) setStations(res);
      })
      .catch(() => {
        // Không chặn trang nếu load danh sách chi nhánh lỗi - chỉ mất filter "Station".
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    getAdminRefunds({
      page: page - 1,
      size: PAGE_SIZE,
      status: status || undefined,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      stationId: stationId ? Number(stationId) : undefined,
      keyword: appliedKeyword || undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        setRows(res.content);
        setTotalCount(res.summary.totalCount);
        setTotalRefundedAmount(res.summary.totalRefundedAmount);
        setTotalPages(Math.max(1, res.totalPages));
      })
      .catch(() => {
        if (isMounted)
          setError("Không thể tải danh sách hoàn tiền. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, status, year, month, stationId, appliedKeyword]);

  /** Cập nhật lại 1 dòng trong bảng sau khi confirm thành công, không cần refetch cả trang. */
  function handleRefunded(updated: RefundDetail) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              status: updated.status,
              refundedAt: updated.refundedAt,
            }
          : row,
      ),
    );
    setTotalRefundedAmount((prev) => prev + updated.refundAmount);
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
          Refund Management
        </h1>
        <p className="text-sm text-on-surface-variant">
          Review and process customer refund requests.
        </p>
      </div>

      {/* ─── KPI summary ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <KpiCard
          icon={Receipt}
          label="Total Refund Requests"
          value={totalCount.toLocaleString()}
        />
        <KpiCard
          icon={Wallet}
          label="Total Refunded Amount"
          value={formatCurrency(totalRefundedAmount)}
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
          placeholder="Search by customer name or phone"
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
          value={status}
          onChange={(e) =>
            handleFilterChange(() =>
              setStatus(e.target.value as RefundStatus | ""),
            )
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
        <select
          value={stationId}
          onChange={(e) =>
            handleFilterChange(() => setStationId(e.target.value))
          }
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        >
          <option value="">All branches</option>
          {stations.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.stationName}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Table ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
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
            No refund requests found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Station
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Requested At
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Refunded At
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRefundId(row.id)}
                    className={`cursor-pointer hover:bg-surface-container-low ${
                      i > 0 ? "border-t border-outline-variant" : ""
                    }`}
                  >
                    <td className="px-6 py-6 text-base font-medium text-on-surface">
                      {row.customerName}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.customerPhone}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.stationName}
                    </td>
                    <td className="px-6 py-6 text-right text-base font-bold text-on-surface">
                      {formatCurrency(row.refundAmount)}
                    </td>
                    <td className="px-6 py-6">
                      <RefundStatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {formatCheckInTime(row.createdAt)}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.refundedAt ? formatCheckInTime(row.refundedAt) : "—"}
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

      <RefundDetailModal
        refundId={selectedRefundId}
        onClose={() => setSelectedRefundId(null)}
        onRefunded={handleRefunded}
      />
    </div>
  );
}

function RefundDetailModal({
  refundId,
  onClose,
  onRefunded,
}: {
  refundId: number | null;
  onClose: () => void;
  onRefunded: (updated: RefundDetail) => void;
}) {
  const [detail, setDetail] = useState<RefundDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transactionCode, setTransactionCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (refundId == null) {
      setDetail(null);
      setTransactionCode("");
      setValidationError(null);
      setConfirmError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getRefundDetail(refundId)
      .then((res) => {
        if (isMounted) setDetail(res);
      })
      .catch(() => {
        if (isMounted)
          setError("Không thể tải chi tiết hoàn tiền. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refundId]);

  function handleConfirm() {
    if (!detail) return;
    const trimmed = transactionCode.trim();
    if (!trimmed) {
      setValidationError("Vui lòng nhập mã giao dịch");
      return;
    }
    setValidationError(null);
    setConfirmError(null);
    setIsConfirming(true);

    confirmRefund(detail.id, trimmed)
      .then((updated) => {
        setDetail(updated);
        onRefunded(updated);
      })
      .catch(() => {
        setConfirmError("Xác nhận hoàn tiền thất bại. Vui lòng thử lại sau.");
      })
      .finally(() => setIsConfirming(false));
  }

  return (
    <Modal isOpen={refundId != null} onClose={onClose} variant="custom" size="lg">
      <div className="flex w-full flex-col gap-4 text-left">
        {error ? (
          <p className="text-center text-base text-error">{error}</p>
        ) : isLoading || !detail ? (
          <p className="text-center text-base text-outline">Đang tải...</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-headline-md font-semibold text-on-surface">
                Refund #{detail.id}
              </p>
              <RefundStatusBadge status={detail.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/20 pt-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                  Customer
                </span>
                <span className="font-semibold text-on-surface">
                  {detail.customerName} · {detail.customerPhone}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                  Booking
                </span>
                <span className="font-semibold text-on-surface">
                  #{detail.bookingId} · {detail.serviceCategoryName} ·{" "}
                  {formatAppointmentDate(detail.appointmentDate)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                  Station
                </span>
                <span className="font-semibold text-on-surface">
                  {detail.stationName}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                  Refund Amount
                </span>
                <span className="font-semibold text-on-surface">
                  {formatCurrency(detail.refundAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-outline-variant/50 p-4">
              <span className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                Transfer To
              </span>
              {detail.qrImageUrl ? (
                <div className="flex justify-center">
                  <img
                    src={detail.qrImageUrl}
                    alt="VietQR refund transfer"
                    className="h-56 w-56 rounded-lg border border-outline-variant/50 object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Bank</span>
                    <span className="font-semibold text-on-surface">
                      {detail.refundBankName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">
                      Account Number
                    </span>
                    <span className="font-semibold text-on-surface">
                      {detail.refundAccountNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">
                      Account Holder
                    </span>
                    <span className="font-semibold text-on-surface">
                      {detail.refundAccountHolder}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {detail.status === "REFUNDED" ? (
              <div className="flex flex-col gap-2 rounded-lg bg-primary/5 p-4 text-sm">
                {detail.refundNote && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">
                      Transaction Code
                    </span>
                    <span className="font-semibold text-on-surface">
                      {detail.refundNote}
                    </span>
                  </div>
                )}
                <p className="text-on-surface-variant">
                  Processed by Admin #{detail.refundedBy}
                  {detail.refundedAt &&
                    `, at ${formatCheckInTime(detail.refundedAt)}`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[1.2px] text-outline">
                  Refund Transaction Code
                </label>
                <input
                  type="text"
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  placeholder="Enter the bank transaction code"
                  className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
                />
                {validationError && (
                  <span className="text-xs text-error">{validationError}</span>
                )}
                {confirmError && (
                  <span className="text-xs text-error">{confirmError}</span>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="mt-2 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
                >
                  {isConfirming ? "Confirming…" : "Confirm Refunded"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

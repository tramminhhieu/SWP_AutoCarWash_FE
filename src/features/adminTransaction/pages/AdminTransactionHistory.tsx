import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import { getAdminTransactions } from "../api/adminTransactionApi";
import { MOCK_STATIONS } from "../api/mockStations";
import type {
  AdminPaymentRow,
  AdminPaymentMethod,
  AdminPaymentStatus,
} from "../types/adminTransaction";
import Modal from "../../../components/ui/Modal";
import {
  formatCheckInTime,
  formatCurrency,
} from "../../booking/utils/bookingFormatters";

const PAGE_SIZE = 8;

type Tab = "subscription" | "singleWash";
type SingleWashTypeFilter = "" | "DEPOSIT" | "FULL_PAYMENT";

const METHOD_OPTIONS: { value: AdminPaymentMethod | ""; label: string }[] = [
  { value: "", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MANUAL", label: "Manual" },
  { value: "MOMO", label: "MoMo" },
  { value: "VNPAY", label: "VNPay" },
];

const STATUS_OPTIONS: { value: AdminPaymentStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
];

const TYPE_OPTIONS: { value: SingleWashTypeFilter; label: string }[] = [
  { value: "", label: "All types" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "FULL_PAYMENT", label: "Full Payment" },
];

function StatusPill({ status }: { status: AdminPaymentStatus }) {
  const isSuccess = status === "SUCCESS";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-[0.6px] ${
        isSuccess
          ? "border-tertiary-container/30 bg-tertiary-container/10 text-tertiary-container"
          : "border-error/30 bg-error-container text-on-error-container"
      }`}
    >
      {isSuccess ? (
        <CircleCheck className="size-3.5" />
      ) : (
        <CircleX className="size-3.5" />
      )}
      {status}
    </span>
  );
}

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

export default function AdminTransactionHistory() {
  const [activeTab, setActiveTab] = useState<Tab>("subscription");

  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter chung cho cả 2 tab
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [method, setMethod] = useState<AdminPaymentMethod | "">("");
  const [status, setStatus] = useState<AdminPaymentStatus | "">("");
  // Chỉ dùng ở tab Single Wash
  const [typeFilter, setTypeFilter] = useState<SingleWashTypeFilter>("");
  const [stationId, setStationId] = useState<number | "">("");

  const [page, setPage] = useState(1);
  const [viewingRow, setViewingRow] = useState<AdminPaymentRow | null>(null);

  // Search bar: gõ tự do, chỉ apply khi bấm Enter/nút search - tránh gọi API
  // mỗi lần gõ phím. appliedSearch mới là thứ thực sự đưa vào query BE.
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState<
    { phone: string } | { bookingId: number } | null
  >(null);
  const [searchHint, setSearchHint] = useState<string | null>(null);

  function handleSearchSubmit() {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setAppliedSearch(null);
      setSearchHint(null);
    } else if (/^0\d{8,10}$/.test(trimmed)) {
      setAppliedSearch({ phone: trimmed });
      setSearchHint(null);
    } else if (/^\d+$/.test(trimmed)) {
      setAppliedSearch({ bookingId: Number(trimmed) });
      setSearchHint(null);
    } else {
      setSearchHint("Enter a phone number or a booking ID");
      return;
    }
    setPage(1);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let isMounted = true;

    const commonFilters = {
      method: method || undefined,
      status: status || undefined,
      fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
      toDate: toDate ? `${toDate}T23:59:59` : undefined,
      phone:
        appliedSearch && "phone" in appliedSearch
          ? appliedSearch.phone
          : undefined,
      bookingId:
        appliedSearch && "bookingId" in appliedSearch
          ? appliedSearch.bookingId
          : undefined,
    };

    const request =
      activeTab === "subscription"
        ? getAdminTransactions({ ...commonFilters, type: "SUBSCRIPTION" }).then(
            (res) => [res],
          )
        : typeFilter
          ? getAdminTransactions({
              ...commonFilters,
              type: typeFilter,
              stationId: stationId || undefined,
            }).then((res) => [res])
          : // "All types" ở tab Single Wash: BE type filter chỉ nhận 1 giá trị,
            // nên gọi riêng DEPOSIT và FULL_PAYMENT rồi gộp lại - không để lẫn
            // với Subscription (tab riêng, không bao giờ gọi chung).
            Promise.all([
              getAdminTransactions({
                ...commonFilters,
                type: "DEPOSIT",
                stationId: stationId || undefined,
              }),
              getAdminTransactions({
                ...commonFilters,
                type: "FULL_PAYMENT",
                stationId: stationId || undefined,
              }),
            ]);

    request
      .then((results) => {
        if (!isMounted) return;
        const mergedTransactions = results
          .flatMap((r) => r.transactions)
          .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
        setRows(mergedTransactions);
        setTotalRevenue(
          results.reduce((sum, r) => sum + r.summary.totalRevenue, 0),
        );
        setTotalCount(
          results.reduce((sum, r) => sum + r.summary.totalCount, 0),
        );
      })
      .catch(() => {
        if (isMounted)
          setError("Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeTab,
    method,
    status,
    fromDate,
    toDate,
    typeFilter,
    stationId,
    appliedSearch,
  ]);

  const successCount = useMemo(
    () => rows.filter((r) => r.paymentStatus === "SUCCESS").length,
    [rows],
  );
  const failedCount = rows.length - successCount;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** Đổi tab/filter và reset về trang 1 + hiện spinner cho lần fetch mới. */
  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setTypeFilter("");
    setStationId("");
    setPage(1);
    setIsLoading(true);
    setError(null);
  }

  function handleFilterChange(update: () => void) {
    update();
    setPage(1);
    setIsLoading(true);
    setError(null);
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
          Transaction History
        </h1>
        <p className="text-sm text-on-surface-variant">
          Reconciliation view of all payment transactions across customers.
        </p>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-8 border-b border-outline-variant/30">
        <button
          onClick={() => handleTabChange("subscription")}
          className={`pb-[14px] text-sm tracking-[0.14px] ${
            activeTab === "subscription"
              ? "border-b-2 border-primary font-semibold text-primary"
              : "font-medium text-on-surface-variant"
          }`}
        >
          Subscription
        </button>
        <button
          onClick={() => handleTabChange("singleWash")}
          className={`pb-[14px] text-sm tracking-[0.14px] ${
            activeTab === "singleWash"
              ? "border-b-2 border-primary font-semibold text-primary"
              : "font-medium text-on-surface-variant"
          }`}
        >
          Single Wash
        </button>
      </div>

      {/* ─── KPI summary ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <KpiCard
          icon={Wallet}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
        />
        <KpiCard
          icon={Receipt}
          label="Total Transactions"
          value={totalCount.toLocaleString()}
        />
        <KpiCard
          icon={CircleCheck}
          label="Successful"
          value={successCount.toLocaleString()}
        />
        <KpiCard
          icon={CircleX}
          label="Failed"
          value={failedCount.toLocaleString()}
        />
      </div>

      {/* ─── Search bar ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchSubmit();
            }}
            placeholder="Search by phone or booking ID"
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
        {searchHint && <span className="text-xs text-error">{searchHint}</span>}
      </div>

      {/* ─── Filter bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            handleFilterChange(() => setFromDate(e.target.value))
          }
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        />
        <span className="text-sm text-on-surface-variant">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => handleFilterChange(() => setToDate(e.target.value))}
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        />
        <select
          value={method}
          onChange={(e) =>
            handleFilterChange(() =>
              setMethod(e.target.value as AdminPaymentMethod | ""),
            )
          }
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
        >
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) =>
            handleFilterChange(() =>
              setStatus(e.target.value as AdminPaymentStatus | ""),
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

        {activeTab === "singleWash" && (
          <>
            <select
              value={typeFilter}
              onChange={(e) =>
                handleFilterChange(() =>
                  setTypeFilter(e.target.value as SingleWashTypeFilter),
                )
              }
              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={stationId}
              onChange={(e) =>
                handleFilterChange(() =>
                  setStationId(e.target.value ? Number(e.target.value) : ""),
                )
              }
              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
            >
              <option value="">All branches</option>
              {MOCK_STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        )}
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
            No transactions found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Phone
                  </th>
                  {activeTab === "singleWash" && (
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                      Booking ID
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Method
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => setViewingRow(row)}
                    className={`cursor-pointer hover:bg-surface-container-low ${
                      i > 0 ? "border-t border-outline-variant" : ""
                    }`}
                  >
                    <td className="px-6 py-6 text-base font-medium text-on-surface">
                      #{row.id}
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.customerPhone ?? "—"}
                    </td>
                    {activeTab === "singleWash" && (
                      <td className="px-6 py-6 text-base text-on-surface">
                        {row.bookingId != null ? `#${row.bookingId}` : "—"}
                      </td>
                    )}
                    <td className="px-6 py-6 text-base text-on-surface">
                      {row.paymentMethod}
                    </td>
                    <td className="px-6 py-6 text-right text-base font-bold text-on-surface">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-6 py-6">
                      <StatusPill status={row.paymentStatus} />
                    </td>
                    <td className="px-6 py-6 text-base text-on-surface">
                      {formatCheckInTime(row.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                        onClick={() => setPage(p)}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        isOpen={viewingRow != null}
        onClose={() => setViewingRow(null)}
        variant="custom"
      >
        {viewingRow && (
          <div className="flex w-full flex-col gap-3 text-left text-sm">
            <p className="text-headline-md font-semibold text-on-surface">
              Transaction #{viewingRow.id}
            </p>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Phone</span>
              <span className="font-semibold text-on-surface">
                {viewingRow.customerPhone ?? "—"}
              </span>
            </div>
            {activeTab === "singleWash" && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Booking ID</span>
                <span className="font-semibold text-on-surface">
                  {viewingRow.bookingId != null
                    ? `#${viewingRow.bookingId}`
                    : "—"}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Payment Method</span>
              <span className="font-semibold text-on-surface">
                {viewingRow.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Amount</span>
              <span className="font-semibold text-on-surface">
                {formatCurrency(viewingRow.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Status</span>
              <StatusPill status={viewingRow.paymentStatus} />
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Created Date</span>
              <span className="font-semibold text-on-surface">
                {formatCheckInTime(viewingRow.paidAt)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Receipt, ShieldCheck } from "lucide-react";
import { getPaymentHistory, getActiveSubscription } from "../api/transactionApi";
import type {
  PaymentHistoryEntry,
  PaymentType,
  ActiveSubscriptionInfo,
} from "../types/transaction";
import { formatCheckInTime, formatCurrency } from "../../booking/utils/bookingFormatters";

function ActiveSubscriptionBanner({
  subscription,
}: {
  subscription: ActiveSubscriptionInfo;
}) {
  return (
    <div className="flex items-center justify-between rounded-[8px] border border-primary/20 bg-primary/5 p-8">
      <div className="flex items-center gap-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-[8px] border border-primary/10 bg-white">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              {subscription.planName}
            </h2>
            <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-white">
              ACTIVE
            </span>
          </div>
          <span className="text-sm text-on-surface-variant">
            {subscription.planType} plan
          </span>
        </div>
      </div>
      <span className="text-sm font-semibold text-on-surface">
        {subscription.daysRemaining} days remaining
      </span>
    </div>
  );
}

const TYPE_LABELS: Record<PaymentType, string> = {
  DEPOSIT: "Booking Deposit",
  FULL_PAYMENT: "Full Payment",
  SUBSCRIPTION: "Subscription Purchase",
};

const FILTER_OPTIONS: { value: PaymentType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "FULL_PAYMENT", label: "Full Payment" },
  { value: "SUBSCRIPTION", label: "Subscription" },
];

function TransactionCard({
  transaction,
  isActive,
  daysRemaining,
  onViewBooking,
}: {
  transaction: PaymentHistoryEntry;
  isActive: boolean;
  daysRemaining: number | null;
  onViewBooking: (bookingId: number) => void;
}) {
  return (
    <div className="flex flex-col rounded-[8px] border border-outline-variant/50 bg-white shadow-[0px_10px_25px_-5px_rgba(17,24,39,0.05)]">
      <div className="flex items-start justify-between p-8">
        <div className="flex gap-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-[8px] border border-primary/10 bg-primary/5">
            {transaction.paymentType === "SUBSCRIPTION" ? (
              <CreditCard className="size-6 text-primary" />
            ) : (
              <Receipt className="size-6 text-primary" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-xl font-semibold text-on-surface">
                {TYPE_LABELS[transaction.paymentType]}
              </h3>
              {isActive && (
                <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-white">
                  ACTIVE
                </span>
              )}
            </div>
            <span className="text-sm text-on-surface-variant">
              {transaction.paymentMethod} • {transaction.transactionCode}
            </span>
          </div>
        </div>
        <span className="font-heading text-xl font-semibold text-on-surface">
          {formatCurrency(transaction.amount)}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-b-[8px] border-t border-outline-variant/20 bg-surface-container-low/30 px-8 py-4">
        <span className="text-sm text-on-surface-variant">
          {isActive && daysRemaining != null
            ? `${daysRemaining} days remaining`
            : formatCheckInTime(transaction.paidAt)}
        </span>
        {transaction.bookingId != null && (
          <button
            onClick={() => onViewBooking(transaction.bookingId!)}
            className="text-sm font-bold tracking-[0.14px] text-primary"
          >
            VIEW BOOKING
          </button>
        )}
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<PaymentType | "">("");
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<PaymentHistoryEntry[]>([]);
  const [activeSubscription, setActiveSubscription] =
    useState<ActiveSubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getPaymentHistory(
        filterType || undefined,
        year ?? undefined,
        month ?? undefined,
      ),
      getActiveSubscription(),
    ])
      .then(([history, activeSub]) => {
        if (!isMounted) return;
        setTransactions(history);
        setActiveSubscription(activeSub);
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
  }, [filterType, year, month]);

  /** Đổi filter và reset state loading để hiện spinner cho lần fetch mới. */
  function handleFilterChange(type: PaymentType | "") {
    setFilterType(type);
    setIsLoading(true);
    setError(null);
  }

  function handleYearChange(newYear: number | null) {
    setYear(newYear);
    // Bỏ chọn năm thì tháng cũng không còn ý nghĩa (BE chỉ áp dụng month kèm year)
    if (newYear === null) setMonth(null);
    setIsLoading(true);
    setError(null);
  }

  function handleMonthChange(newMonth: number | null) {
    setMonth(newMonth);
    setIsLoading(true);
    setError(null);
  }

  const isTransactionActive = (t: PaymentHistoryEntry) =>
    t.paymentType === "SUBSCRIPTION" &&
    activeSubscription != null &&
    t.subscriptionInvoiceId != null;

  const sortedTransactions = useMemo(() => {
    const active = transactions.filter(isTransactionActive);
    const rest = transactions
      .filter((t) => !isTransactionActive(t))
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    return [...active, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, activeSubscription]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
          My Transaction
        </h1>
      </div>

      {!isLoading && !error && activeSubscription && (
        <ActiveSubscriptionBanner subscription={activeSubscription} />
      )}

      <div className="flex items-end justify-between">
        <div />
        <div className="flex items-center gap-3">
          <select
            value={year ?? ""}
            onChange={(e) =>
              handleYearChange(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
          >
            <option value="">All years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={month ?? ""}
            disabled={year === null}
            onChange={(e) =>
              handleMonthChange(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All months</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Month {m}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) =>
              handleFilterChange(e.target.value as PaymentType | "")
            }
            className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="flex h-48 items-center justify-center text-base text-error">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          Đang tải...
        </div>
      ) : sortedTransactions.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          No transactions found
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              isActive={isTransactionActive(transaction)}
              daysRemaining={activeSubscription?.daysRemaining ?? null}
              onViewBooking={(bookingId) =>
                navigate(`/booking/history/${bookingId}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

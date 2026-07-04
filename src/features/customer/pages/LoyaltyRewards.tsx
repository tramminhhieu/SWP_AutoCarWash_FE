import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gem,
  History,
  Shield,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  getLoyaltyProfile,
  getLoyaltyTiers,
  getLoyaltyHistory,
  getTierHistory,
} from "../api/loyaltyApi";
import type {
  LoyaltyProfile,
  LoyaltyTier,
  LoyaltyTransaction,
  TierHistoryEntry,
} from "../types/loyalty";
import { getTierStyle } from "../../../constants/tierStyles";
import { formatAppointmentDate } from "../../booking/utils/bookingFormatters";

// Icon riêng cho từng tier (API trả tên: MEMBER/SILVER/GOLD/PLATINUM)
const TIER_ICONS: Record<string, typeof Shield> = {
  MEMBER: Shield,
  SILVER: Award,
  GOLD: Star,
  PLATINUM: Gem,
};

const PAGE_SIZE = 5;

export default function LoyaltyRewards() {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [historyTotalSpending, setHistoryTotalSpending] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [tierHistoryYear, setTierHistoryYear] = useState(
    () => new Date().getFullYear(),
  );
  const [tierHistoryMonth, setTierHistoryMonth] = useState<number | null>(
    null,
  );
  const [tierHistory, setTierHistory] = useState<TierHistoryEntry[]>([]);
  const [isTierHistoryLoading, setIsTierHistoryLoading] = useState(true);
  const [tierHistoryError, setTierHistoryError] = useState<string | null>(
    null,
  );
  const [tierHistoryPage, setTierHistoryPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getLoyaltyProfile(), getLoyaltyTiers()])
      .then(([profileData, tiersData]) => {
        if (!isMounted) return;
        setProfile(profileData);
        setTiers(tiersData);
      })
      .catch(() => {
        if (isMounted)
          setError("Không thể tải thông tin loyalty. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    getLoyaltyHistory(year, month ?? undefined)
      .then((data) => {
        if (!isMounted) return;
        setTransactions(data.transactions);
        setHistoryTotalSpending(data.totalSpending);
        setCurrentPage(1);
      })
      .catch(() => {
        if (isMounted)
          setHistoryError("Không thể tải lịch sử điểm. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (isMounted) setIsHistoryLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [year, month]);

  useEffect(() => {
    let isMounted = true;
    getTierHistory(tierHistoryYear, tierHistoryMonth ?? undefined)
      .then((data) => {
        if (!isMounted) return;
        setTierHistory(data);
        setTierHistoryPage(1);
      })
      .catch(() => {
        if (isMounted)
          setTierHistoryError(
            "Không thể tải lịch sử hạng thành viên. Vui lòng thử lại sau.",
          );
      })
      .finally(() => {
        if (isMounted) setIsTierHistoryLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [tierHistoryYear, tierHistoryMonth]);

  /** Đổi filter năm/tháng và reset state loading để hiện spinner cho lần fetch mới. */
  function handleYearChange(newYear: number) {
    setYear(newYear);
    setIsHistoryLoading(true);
    setHistoryError(null);
  }

  function handleMonthChange(newMonth: number | null) {
    setMonth(newMonth);
    setIsHistoryLoading(true);
    setHistoryError(null);
  }

  function handleTierHistoryYearChange(newYear: number) {
    setTierHistoryYear(newYear);
    setIsTierHistoryLoading(true);
    setTierHistoryError(null);
  }

  function handleTierHistoryMonthChange(newMonth: number | null) {
    setTierHistoryMonth(newMonth);
    setIsTierHistoryLoading(true);
    setTierHistoryError(null);
  }

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.minPoints - b.minPoints),
    [tiers],
  );
  const maxTierPoints = sortedTiers.at(-1)?.minPoints ?? 1;
  const progressPercent = profile
    ? Math.min((profile.accumulatedPoints / maxTierPoints) * 100, 100)
    : 0;
  const currentTierIndex = profile
    ? sortedTiers.findIndex(
        (t) => t.tierName.toUpperCase() === profile.tierName.toUpperCase(),
      )
    : -1;

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginatedActivity = transactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const tierHistoryTotalPages = Math.ceil(tierHistory.length / PAGE_SIZE);
  const paginatedTierHistory = tierHistory.slice(
    (tierHistoryPage - 1) * PAGE_SIZE,
    tierHistoryPage * PAGE_SIZE,
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface py-8">
        <div className="mx-auto flex h-48 max-w-[1200px] items-center justify-center px-6 text-base text-outline">
          Đang tải...
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-surface py-8">
        <div className="mx-auto flex h-48 max-w-[1200px] items-center justify-center px-6 text-base text-error">
          {error ?? "Không thể tải thông tin loyalty."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6">
        {/* ─── Breadcrumbs ─────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3 text-outline-variant" />
          <span>Membership</span>
          <ChevronRight className="size-3 text-outline-variant" />
          <span className="font-bold text-primary">Loyalty Details</span>
        </nav>

        {/* ─── Page header + Points badge ──────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-on-surface">
              Loyalty &amp; Rewards
            </h1>
            <p className="max-w-[672px] text-lg text-on-surface-variant">
              Manage your membership status, track your precision detail points,
              and unlock exclusive high-performance benefits.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex shrink-0 items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <Award className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Available Points
                </p>
                <p className="flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-semibold text-primary">
                    {profile.totalPoints.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium tracking-wide text-primary">
                    PTS
                  </span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Total Spent
                </p>
                <p className="flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-semibold text-on-surface">
                    {profile.currentTotalSpending.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-sm font-medium tracking-wide text-on-surface">
                    ₫
                  </span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-high p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <Clock className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Points Reset
                </p>
                <p className="flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-semibold text-on-surface">
                    {formatAppointmentDate(profile.upcomingResetDate)}
                  </span>
                </p>
                <p className="text-xs text-on-surface-variant">
                  {profile.daysUntilReset.toLocaleString()} days left
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Loyalty Progress card ───────────────────────────────────── */}
        <section className="rounded-lg border border-outline-variant bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              Loyalty Progress
            </h2>
          </div>

          <p className="mb-8 text-base text-on-surface-variant">
            {profile.nextTierName
              ? `You are currently at ${profile.tierName} status. Only ${profile.pointsToNextTier?.toLocaleString()} points until ${profile.nextTierName}.`
              : `You are currently at ${profile.tierName} status. You've reached the highest tier.`}
          </p>

          {/* Track */}
          <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Markers */}
          <div className="relative mt-4 h-14">
            {sortedTiers.map((tier, index) => {
              const isActive =
                currentTierIndex !== -1
                  ? index === currentTierIndex
                  : tier.tierName === profile.tierName;
              const isDimmed =
                currentTierIndex !== -1
                  ? index > currentTierIndex
                  : tier.minPoints > profile.totalPoints;
              const leftPercent = (tier.minPoints / maxTierPoints) * 100;
              return (
                <div
                  key={tier.tierName}
                  className={`absolute flex flex-col items-center ${
                    isDimmed ? "opacity-40" : ""
                  }`}
                  style={{
                    left: `${leftPercent}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <span
                    className={`mb-1 h-3 w-1 rounded-full ${
                      isActive ? "bg-primary" : "bg-outline-variant"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "font-bold text-primary" : "text-on-surface"
                    }`}
                  >
                    {tier.tierName}
                    {isActive && " (Active)"}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isActive ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {tier.minPoints.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Tier Retention card ─────────────────────────────────────── */}
        {profile.retentionTargetAmount > 0 && (
          <section className="rounded-lg border border-outline-variant bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="mb-6 flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold text-on-surface">
                Tier Retention
              </h2>
            </div>

            <div className="mb-6 flex flex-wrap gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Accumulated Points
                </p>
                <p className="font-heading text-2xl font-semibold text-on-surface">
                  {profile.accumulatedPoints.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Points to Maintain {profile.tierName}
                </p>
                <p className="font-heading text-2xl font-semibold text-on-surface">
                  {currentTierIndex !== -1
                    ? sortedTiers[currentTierIndex].minPoints.toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>

            {(() => {
              const remainingToRetain = Math.max(
                profile.retentionTargetAmount - profile.retentionCurrentAmount,
                0,
              );
              const retentionPercent = Math.min(
                (profile.retentionCurrentAmount / profile.retentionTargetAmount) *
                  100,
                100,
              );
              const retentionEndDateText = formatAppointmentDate(
                profile.retentionEndDate,
              );

              return (
                <>
                  {remainingToRetain > 0 && (
                    <div className="mb-6 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
                      Spend {remainingToRetain.toLocaleString("vi-VN")} ₫ more
                      before {retentionEndDateText} to keep your{" "}
                      {profile.tierName} status.
                    </div>
                  )}

                  <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 transition-all"
                      style={{ width: `${retentionPercent}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* ─── Membership Tiers grid ───────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              Membership Tiers
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sortedTiers.map((tier, index) => {
              const Icon = TIER_ICONS[tier.tierName] ?? Shield;
              const style = getTierStyle(tier.tierName);
              const active =
                currentTierIndex !== -1
                  ? index === currentTierIndex
                  : tier.tierName === profile.tierName;
              const locked =
                currentTierIndex !== -1
                  ? index > currentTierIndex
                  : tier.minPoints > profile.totalPoints;
              return (
                <div
                  key={tier.tierName}
                  className={`relative flex flex-col gap-4 self-start overflow-hidden rounded-lg bg-white p-6 ${
                    active
                      ? "border-2 border-primary shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
                      : "border border-outline-variant"
                  } ${locked ? "opacity-75" : ""}`}
                >
                  {/* Badge "CURRENT STATUS" cho tier đang active */}
                  {active && (
                    <div className="absolute right-0 top-0 rounded-bl bg-primary px-6 py-1 text-xs font-bold text-white">
                      CURRENT STATUS
                    </div>
                  )}

                  {/* Header: icon + ngưỡng điểm */}
                  <div className="flex items-start justify-between">
                    <Icon
                      className={`size-5 ${
                        active ? "text-primary" : "text-on-surface-variant"
                      }`}
                    />
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        active
                          ? "bg-secondary-container/20 text-secondary"
                          : "bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      {tier.minPoints.toLocaleString()}+ PTS
                    </span>
                  </div>

                  {/* Tên tier */}
                  <h3
                    className={`font-heading text-xl font-semibold ${
                      active ? style.label : "text-on-surface"
                    }`}
                  >
                    {tier.tierName}
                  </h3>

                  {/* Danh sách perks */}
                  <ul className="flex flex-col gap-2">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2">
                        <Check className="size-4 shrink-0 text-tertiary-container" />
                        <span className="text-sm font-normal text-on-surface-variant">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Recent Activity ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold text-on-surface">
                Recent Activity
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {!historyError && !isHistoryLoading && (
                <span className="text-sm font-medium text-on-surface-variant">
                  Total spending: {historyTotalSpending.toLocaleString("vi-VN")} ₫
                </span>
              )}
              <select
                value={year}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={month ?? ""}
                onChange={(e) =>
                  handleMonthChange(e.target.value ? Number(e.target.value) : null)
                }
                className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
              >
                <option value="">All months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Month {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            {historyError ? (
              <div className="flex h-48 items-center justify-center text-base text-error">
                {historyError}
              </div>
            ) : isHistoryLoading ? (
              <div className="flex h-48 items-center justify-center text-base text-outline">
                Đang tải...
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-base text-outline">
                No activity for this period
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low">
                      <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Description
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedActivity.map((row, i) => (
                      <tr
                        key={`${row.createdAt}-${i}`}
                        className={
                          i > 0 ? "border-t border-outline-variant" : undefined
                        }
                      >
                        <td className="px-6 py-6 text-base text-on-surface">
                          {formatAppointmentDate(row.createdAt.slice(0, 10))}
                        </td>
                        <td className="px-6 py-6 text-base text-on-surface">
                          {row.servicePackageName}
                        </td>
                        <td
                          className={`px-6 py-6 text-right text-base font-bold ${
                            row.points < 0 ? "text-error" : "text-tertiary-container"
                          }`}
                        >
                          {row.points < 0
                            ? row.points.toLocaleString()
                            : `+${row.points.toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              page === currentPage
                                ? "bg-primary text-white"
                                : "text-on-surface-variant hover:bg-surface-container-low"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
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
        </section>

        {/* ─── Tier History ────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold text-on-surface">
                Tier History
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tierHistoryYear}
                onChange={(e) =>
                  handleTierHistoryYearChange(Number(e.target.value))
                }
                className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={tierHistoryMonth ?? ""}
                onChange={(e) =>
                  handleTierHistoryMonthChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
              >
                <option value="">All months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Month {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            {tierHistoryError ? (
              <div className="flex h-48 items-center justify-center text-base text-error">
                {tierHistoryError}
              </div>
            ) : isTierHistoryLoading ? (
              <div className="flex h-48 items-center justify-center text-base text-outline">
                Đang tải...
              </div>
            ) : tierHistory.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-base text-outline">
                No tier changes yet
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low">
                      <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Change
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Points
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTierHistory.map((row, i) => (
                      <tr
                        key={row.id}
                        className={
                          i > 0 ? "border-t border-outline-variant" : undefined
                        }
                      >
                        <td className="px-6 py-6 text-base text-on-surface">
                          {formatAppointmentDate(row.createdAt.slice(0, 10))}
                        </td>
                        <td className="px-6 py-6 text-base text-on-surface">
                          {row.oldTierName
                            ? `${row.oldTierName} → ${row.newTierName}`
                            : `Joined as ${row.newTierName}`}
                        </td>
                        <td className="px-6 py-6 text-right text-base font-bold text-on-surface">
                          {row.pointsAtTransition.toLocaleString()}
                        </td>
                        <td className="px-6 py-6 text-right">
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              row.changeType === "DOWNGRADE"
                                ? "border border-error/30 bg-error-container text-on-error-container"
                                : "bg-surface-container-low text-on-surface-variant"
                            }`}
                          >
                            {row.changeType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {tierHistoryTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setTierHistoryPage((p) => Math.max(1, p - 1))
                      }
                      disabled={tierHistoryPage === 1}
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: tierHistoryTotalPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setTierHistoryPage(page)}
                          className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            page === tierHistoryPage
                              ? "bg-primary text-white"
                              : "text-on-surface-variant hover:bg-surface-container-low"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setTierHistoryPage((p) =>
                          Math.min(tierHistoryTotalPages, p + 1),
                        )
                      }
                      disabled={tierHistoryPage === tierHistoryTotalPages}
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
        </section>
      </div>
    </main>
  );
}

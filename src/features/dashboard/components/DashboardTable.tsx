import type { DashboardTables } from "../types/dashboard";
import { getTierStyle } from "../../../constants/tierStyles";

interface Props {
  tables: DashboardTables | null;
  isLoading: boolean;
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-4 w-32 animate-pulse rounded bg-surface-container-high" />
      <div className="h-2 flex-1 animate-pulse rounded-full bg-surface-container-high" />
      <div className="h-4 w-8 animate-pulse rounded bg-surface-container-high" />
    </div>
  );
}

// ─── Bảng trái: Top Service Packages ──────────────────────────────────────────
function TopPackagesTable({
  packages,
  isLoading,
}: {
  packages: DashboardTables["packageStats"] | null;
  isLoading: boolean;
}) {
  // Màu progress bar: đổi theo thứ tự (cột 1 đậm nhất)
  const BAR_COLORS = ["#1D4ED8", "#0EA5E9", "#93c5fd"];

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
      <h3 className="mb-1 font-heading text-lg font-semibold text-on-surface">
        Top Service Packages
      </h3>
      <p className="mb-5 text-xs text-outline">
        Package popularity distribution
      </p>

      {isLoading ? (
        <div className="divide-y divide-outline-variant/20">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : !packages || packages.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-outline">
          No data available
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/20">
          {/* Sort theo percentage DESC (phòng hờ FE nếu BE chưa sort) */}
          {[...packages]
            .sort((a, b) => b.percentage - a.percentage)
            .map((pkg, idx) => (
              <div key={pkg.packageName} className="flex flex-col gap-1.5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">
                    {pkg.packageName}
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {pkg.percentage}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pkg.percentage}%`,
                      backgroundColor: BAR_COLORS[idx] ?? "#1D4ED8",
                    }}
                  />
                </div>
                <span className="text-xs text-outline">
                  {pkg.bookingCount.toLocaleString("en-US")} bookings
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Bảng phải: Customer Tier Distribution ────────────────────────────────────
function TierTable({
  tiers,
  isLoading,
}: {
  tiers: DashboardTables["tierStats"] | null;
  isLoading: boolean;
}) {
  // Tổng khách hàng để tính %
  const total = tiers?.reduce((sum, t) => sum + t.customerCount, 0) ?? 0;

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
      <h3 className="mb-1 font-heading text-lg font-semibold text-on-surface">
        Customer Tier Summary
      </h3>
      <p className="mb-5 text-xs text-outline">
        System-wide snapshot — unaffected by date or branch filters
      </p>

      {isLoading ? (
        <div className="divide-y divide-outline-variant/20">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="h-6 w-20 animate-pulse rounded-full bg-surface-container-high" />
              <div className="h-4 w-16 animate-pulse rounded bg-surface-container-high" />
            </div>
          ))}
        </div>
      ) : !tiers || tiers.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-outline">
          No data available
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/20">
          {tiers.map((tier) => {
            // getTierStyle nhận string, tự fallback về MEMBER nếu tier không khớp
            const style = getTierStyle(tier.tier);
            const pct =
              total > 0 ? Math.round((tier.customerCount / total) * 100) : 0;
            return (
              <div
                key={tier.tier}
                className="flex items-center justify-between py-3"
              >
                {/* Badge: dùng style.badge (combined bg + text class từ tierStyles.ts) */}
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.6px] ${style.badge}`}
                >
                  {tier.tier}
                </span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-bold text-on-surface">
                    {tier.customerCount.toLocaleString("en-US")}
                  </span>
                  <span className="text-xs text-outline">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Export: layout 2 cột ──────────────────────────────────────────────────────
export default function DashboardTablesSection({ tables, isLoading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TopPackagesTable
        packages={tables?.packageStats ?? null}
        isLoading={isLoading}
      />
      <TierTable tiers={tables?.tierStats ?? null} isLoading={isLoading} />
    </div>
  );
}

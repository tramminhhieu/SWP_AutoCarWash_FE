// Màu sắc cho từng tier — dùng chung toàn hệ thống

export interface TierStyleConfig {
  /** Badge pill: bg + text (vd: sidebar, danh sách customer trong admin) */
  badge: string;
  /** Màu fill của progress bar */
  bar: string;
  /** Màu chữ tên tier (vd: góc phải của tier card) */
  label: string;
}

export const TIER_STYLES: Record<string, TierStyleConfig> = {
  Member: {
    badge: "bg-slate-100 text-slate-700",
    bar: "bg-slate-400",
    label: "text-slate-700",
  },
  Silver: {
    badge: "bg-slate-200 text-slate-700",
    bar: "bg-slate-500",
    label: "text-slate-700",
  },
  Gold: {
    badge: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
    label: "text-amber-600",
  },
  Platinum: {
    badge: "bg-purple-100 text-purple-700",
    bar: "bg-purple-500",
    label: "text-purple-600",
  },
};

// Lấy style theo tên tier, fallback về Member nếu BE trả tên không khớp
// Dùng: const style = getTierStyle(tier.currentTierName);
export function getTierStyle(tierName: string): TierStyleConfig {
  return TIER_STYLES[tierName] ?? TIER_STYLES["Member"];
}

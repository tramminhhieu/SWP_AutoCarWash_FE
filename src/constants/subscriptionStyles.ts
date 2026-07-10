// Style cho từng loại gói đăng ký (plan_type từ bảng subscription_plan - DB.txt)

export interface SubscriptionStyleConfig {
  /** Badge pill: bg + text — dùng cho chip hiển thị tên gói trên xe/danh sách */
  badge: string;
  /** Màu border của badge pill */
  border: string;
}

export const SUBSCRIPTION_STYLES: Record<string, SubscriptionStyleConfig> = {
  // Gói cá nhân không giới hạn lượt rửa — màu xanh lá (tertiary) theo DESIGN.md
  UNLIMITED: {
    badge: "bg-tertiary/10 text-tertiary",
    border: "border-tertiary/30",
  },
  // Gói gia đình (dùng chung trong family_group) — màu xanh dương primary
  FAMILY: {
    badge: "bg-primary/10 text-primary",
    border: "border-primary/30",
  },
};

// Lấy style theo plan_type, fallback về UNLIMITED nếu BE trả type không khớp
export function getSubscriptionStyle(
  planType: string,
): SubscriptionStyleConfig {
  return SUBSCRIPTION_STYLES[planType] ?? SUBSCRIPTION_STYLES["UNLIMITED"];
}

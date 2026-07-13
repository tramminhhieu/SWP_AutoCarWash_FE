// Style cho từng loại gói đăng ký (plan_type từ bảng subscription_plan - DB.txt)

export interface SubscriptionStyleConfig {
  /** Badge pill: bg + text — dùng cho chip hiển thị tên gói trên xe/danh sách */
  badge: string;
  /** Màu border của badge pill */
  border: string;
}

export const SUBSCRIPTION_STYLES: Record<string, SubscriptionStyleConfig> = {
  // Gói cá nhân không giới hạn lượt rửa — màu xanh lá (tertiary) theo DESIGN.md
  // Key = giá trị thật BE trả ("UNLIMIT", confirm 2026-07-08) - KHÔNG phải chữ hiển thị.
  UNLIMIT: {
    badge: "bg-tertiary/10 text-tertiary",
    border: "border-tertiary/30",
  },
  // Gói gia đình (dùng chung trong family_group) — màu xanh dương primary
  FAMILY: {
    badge: "bg-primary/10 text-primary",
    border: "border-primary/30",
  },
};

// Lấy style theo plan_type, fallback về UNLIMIT nếu BE trả type không khớp
export function getSubscriptionStyle(
  planType: string,
): SubscriptionStyleConfig {
  return SUBSCRIPTION_STYLES[planType] ?? SUBSCRIPTION_STYLES["UNLIMIT"];
}

// Text hiển thị cho người dùng - tách biệt khỏi giá trị enum thật dùng để so sánh/gọi API.
// "UNLIMIT" (giá trị thật BE trả) vẫn phải hiện chữ "UNLIMITED" trên UI.
const SUBSCRIPTION_TYPE_LABELS: Record<string, string> = {
  UNLIMIT: "UNLIMITED",
  FAMILY: "FAMILY",
};

export function getSubscriptionTypeLabel(planType: string): string {
  return SUBSCRIPTION_TYPE_LABELS[planType] ?? planType;
}

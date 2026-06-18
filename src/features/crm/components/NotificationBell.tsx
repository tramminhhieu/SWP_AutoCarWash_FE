import { Bell } from "lucide-react";

/**
 * Chuông thông báo - tạm thời ở dạng tĩnh (chưa có logic mở dropdown,
 * chưa nối số lượng chưa đọc). Sẽ nâng cấp khi có API thật.
 */
export default function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#434655] transition-colors hover:bg-[#e9edff] hover:text-[#0037b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
    >
      <Bell className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Puzzle,
  Waves,
  LogOut,
  User as UserIcon,
  Tag,
  Receipt,
  Users,
  UserCog,
  Settings,
  Banknote,
  HeartHandshake,
  Infinity as InfinityIcon,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/* Danh sách nav — tạm 2 mục, thêm sau khi cần */
const navItems = [
  { path: "/admin/dashboards", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/add-ons", label: "Add-on", icon: Puzzle },
  { path: "/admin/service-packages", label: "Service Package", icon: Package },
  {
    path: "/admin/unlimited-subscriptions",
    label: "Unlimited Subscription",
    icon: InfinityIcon,
    // Highlight khi đứng ở trang Create/Edit của loại Unlimited
    matchPaths: ["/admin/subscription-plans/unlimited"],
  },
  {
    path: "/admin/family-subscriptions",
    label: "Family Subscription",
    icon: HeartHandshake,
    // Highlight khi đứng ở trang Create/Edit của loại Family
    matchPaths: ["/admin/subscription-plans/family"],
  },
  { path: "/admin/wash-lanes", label: "Wash Lane", icon: Waves },
  { path: "/admin/promotions", label: "Promotions", icon: Tag },
  { path: "/admin/transactions", label: "Total Revenue", icon: Receipt },
  { path: "/admin/customers", label: "Customer", icon: Users },
  { path: "/admin/employees", label: "Staff", icon: UserCog },
  { path: "/admin/refunds", label: "Refund Management", icon: Banknote },
  { path: "/admin/system-settings", label: "System Setting", icon: Settings },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  // Highlight khi đứng ở Create hoặc Edit của từng loại subscription plan —
  // URL đã chứa type nên chỉ cần check pathname prefix, không cần đọc state
  const extraActiveMap: Record<string, boolean> = {
    "/admin/unlimited-subscriptions": pathname.startsWith(
      "/admin/subscription-plans/unlimited",
    ),
    "/admin/family-subscriptions": pathname.startsWith(
      "/admin/subscription-plans/family",
    ),
  };

  return (
    <aside className="fixed top-0 left-0 z-20 flex h-screen w-62 flex-col bg-surface-container-lowest border-r border-outline-variant">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-[-0.01em] text-primary">
          HydroLux
        </h1>
        <p className="text-sm mt-1 tracking-widest text-on-surface-variant font-bold">
          Management System
        </p>
      </div>

      {/* Nav — spacing rộng, thoáng theo mockup. min-h-0 để flex-1 thực sự co lại
          thay vì giãn theo nội dung, cho phép overflow-y-auto cuộn khi danh sách
          dài hơn viewport (không thì các mục cuối bị tràn ra ngoài, không cuộn tới được). */}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4 pt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isExtraActive = extraActiveMap[item.path] ?? false;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive || isExtraActive
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — user info + logout giữ nguyên */}
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3 border-t border-outline-variant">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary">
              <UserIcon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-on-surface">
                {user.name && !user.name.startsWith("ROLE_")
                  ? user.name
                  : "Administrator"}
              </p>

              <p className="font-body text-sm text-on-surface-variant truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg w-full text-sm transition-colors hover:bg-error-container text-error"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  );
}

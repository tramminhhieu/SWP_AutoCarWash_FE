import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  LogOut,
  Receipt,
  Users,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getAllStations } from "../features/adminCustomer/api/adminCustomerBookingApi";

const navItems = [
  { path: "/staff/queue", label: "Queue", icon: CalendarCheck },
  { path: "/staff/customers", label: "Customers", icon: Users },
  { path: "/staff/transactions", label: "Transactions", icon: Receipt },
  { path: "/staff/dashboards", label: "Dashboard", icon: LayoutDashboard },
];

export default function StaffSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stationName, setStationName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.stationId) return;
    let isMounted = true;
    getAllStations()
      .then((stations) => {
        if (!isMounted) return;
        const match = stations.find((s) => s.id === user.stationId);
        setStationName(match?.stationName ?? null);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user?.stationId]);

  return (
    <aside className="fixed top-0 left-0 z-20 flex h-screen w-62 flex-col bg-surface-container-lowest border-r border-outline-variant">
      {/* Logo — đồng bộ kích thước với AdminSidebar */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-[-0.01em] text-primary">
          HydroLux
        </h1>
        <p className="text-sm mt-1 tracking-widest text-on-surface-variant font-bold">
          Management Station
        </p>
        {stationName && (
          <p className="text-sm mt-1 tracking-widest text-on-surface-variant font-bold">
            {stationName}
          </p>
        )}
      </div>

      {/* Nav — spacing, padding, icon size khớp Admin */}
      <nav className="flex flex-col gap-1 flex-1 px-4 pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — user info + Walk-in button + logout */}
      <div className="flex flex-col gap-3 px-4 py-4 border-t border-outline-variant">
        {/* Hiển thị thông tin staff đang đăng nhập */}
        {user && (
          <div className="flex items-center gap-3 px-2">
            {/* Avatar dùng icon giống Admin thay vì chữ cái đầu */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary">
              <UserIcon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-on-surface">
                {user.name && !user.name.startsWith("ROLE_")
                  ? user.name
                  : "Staff"}
              </p>
              <p className="font-body text-sm text-on-surface-variant truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Nút tạo Walk-in — đặc thù Staff, giữ nguyên */}
        <button
          onClick={() => navigate("/staff/walk-in")}
          className="w-full py-2.5 rounded-md text-sm font-semibold bg-primary text-on-primary transition hover:opacity-90"
        >
          + Create Walk-in
        </button>

        {/* Logout — style đỏ khớp Admin */}
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

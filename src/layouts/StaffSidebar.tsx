import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, Users, Wrench, BarChart2, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { path: "/staff/overview", label: "Overview", icon: LayoutDashboard },
  { path: "/staff/queue", label: "Queue", icon: CalendarCheck },
  { path: "/staff/services", label: "Services", icon: Wrench },
  { path: "/staff/customers", label: "Customers", icon: Users },
  { path: "/staff/staff", label: "Staff", icon: Users },
  { path: "/staff/reports", label: "Reports", icon: BarChart2 },
];

export default function StaffSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 z-20 flex h-screen w-56 flex-col py-6 px-4 bg-surface-container-lowest border-r border-outline-variant">
      {/* Logo */}
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold leading-tight font-heading text-primary">HydroLux</h1>
        <p className="text-xs mt-1 text-on-surface-variant">Management Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
        {/* User info */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-primary-fixed text-on-primary-fixed">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface">{user?.name ?? "Staff"}</p>
            <p className="text-xs text-on-surface-variant">{user?.email ?? ""}</p>
          </div>
        </div>

        {/* Create Walk-in */}
        <button
          onClick={() => navigate("/staff/walk-in")}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary transition hover:bg-primary-container"
        >
          + Create Walk-in
        </button>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg w-full text-xs transition-colors hover:bg-surface-container text-on-surface-variant"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  );
}
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wrench,
  BarChart2,
  LogOut,
} from "lucide-react";

const navItems = [
  { path: "/staff/overview", label: "Overview", icon: LayoutDashboard },
  { path: "/staff/queue", label: "Bookings", icon: CalendarCheck },
  { path: "/staff/services", label: "Services", icon: Wrench },
  { path: "/staff/customers", label: "Customers", icon: Users },
  { path: "/staff/reports", label: "Reports", icon: BarChart2 },
];

export default function StaffSidebar() {
  const navigate = useNavigate();

  return (
    <aside
      className="fixed top-0 left-0 z-20 flex h-screen w-56 flex-col py-6 px-4"
      style={{ background: "#0037b0" }}
    >
      {/* Logo */}
      <div className="mb-8 px-2">
        <h1
          className="text-xl font-bold leading-tight"
          style={{ fontFamily: "Montserrat, sans-serif", color: "#ffffff" }}
        >
          HydroLux
        </h1>
        <p className="text-xs mt-1" style={{ color: "#b7c4ff" }}>
          Management Portal
        </p>
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
                    ? "bg-white text-[#0037b0]"
                    : "text-[#b7c4ff] hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — user info */}
      <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <div className="flex items-center gap-3 px-2 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "#b7c4ff", color: "#0037b0" }}
          >
            U
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "#ffffff" }}>
              Uames Wilson
            </p>
            <p className="text-xs" style={{ color: "#b7c4ff" }}>
              Shift Lead
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg w-full text-xs transition-colors hover:bg-white/10"
          style={{ color: "#b7c4ff" }}
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  );
}
import { NavLink, useNavigate } from "react-router-dom";
import { Package, Puzzle, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/* Danh sách nav — tạm 2 mục, thêm sau khi cần */
const navItems = [
  { path: "/admin/service-packages", label: "Service Package", icon: Package },
  { path: "/admin/add-ons", label: "Add-on", icon: Puzzle },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

      {/* Nav — spacing rộng, thoáng theo mockup */}
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

      {/* Bottom — user info + logout giữ nguyên */}
      <div className="flex flex-col gap-3 px-4 py-4 border-t border-outline-variant">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary">
              <UserIcon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-on-surface">
                {user.name}
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

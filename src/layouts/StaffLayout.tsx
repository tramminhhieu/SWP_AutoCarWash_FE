/*@author: Bảo Ngọc 
 @version 1.0
*/
import { Outlet, NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/staff/queue", label: "Queue Managerment"},
  { path: "/staff/bookings", label: "Bookings"},
  { path: "/staff/customers", label: "Customers",},
];

export default function StaffLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-[#0037b0] flex flex-col py-6 px-4 gap-2 fixed top-0 left-0 z-20">
        {/* Logo */}
        <div className="mb-8 px-2">
          <h1 className="text-white font-bold text-xl leading-tight">
            HydroLux
          </h1>
          <p className="text-blue-200 text-xs mt-1">Management Portal</p>
        </div>

        {/* Nav */}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-[#0037b0]"
                  : "text-blue-100 hover:bg-blue-800"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Bottom */}
        <div className="mt-auto pt-6 border-t border-blue-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-sm font-bold text-[#0037b0]">
              U
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Uames Wilson</p>
              <p className="text-blue-300 text-xs">Shift Lead</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="mt-3 w-full text-xs text-blue-300 hover:text-white text-left px-2"
          >
            Logout →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 p-6">
        <Outlet />
      </main>
    </div>
  );
}
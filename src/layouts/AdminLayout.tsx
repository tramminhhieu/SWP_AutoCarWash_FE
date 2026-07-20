import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

/**
 * Layout khung cho toàn bộ trang admin.
 * Sidebar fixed w-56 (224px) bên trái, nội dung chính dùng ml-56 để tránh bị che.
 */
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      {/* Vùng nội dung chính — offset trái bằng đúng chiều rộng sidebar */}
      <main className="ml-56 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

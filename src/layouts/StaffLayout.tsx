import { Outlet } from "react-router-dom";
import StaffSidebar from "./StaffSidebar";

export default function StaffLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar />
      <main className="flex-1 ml-56 p-6">
        <Outlet />
      </main>
    </div>
  );
}
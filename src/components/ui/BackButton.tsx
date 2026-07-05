import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface BackButtonProps {
  className?: string;
}

// Nút back dùng chung cho mọi trang, đặt trong Layout (Customer/Staff/Admin).
// Dùng navigate(-1) để quay đúng theo lịch sử SPA, không hardcode route đích.
const BackButton = ({ className = "" }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from;

  // location.key === "default" nghĩa là đây là entry đầu tiên của session hiện tại
  // (vào thẳng bằng URL / F5) -> không có trang trước trong lịch sử SPA để quay về,
  // ẩn nút để tránh bấm mà không có tác dụng
  const HIDDEN_ROUTES = ["/", "/login", "/register"];

  if (location.key === "default" || HIDDEN_ROUTES.includes(location.pathname)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => (from ? navigate(from) : navigate(-1))}
      className={`flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-bold tracking-[0.14px] text-on-surface shadow-sm transition-opacity hover:opacity-80 ${className}`}
    >
      <ArrowLeft className="size-7" />
      Back
    </button>
  );
};

export default BackButton;

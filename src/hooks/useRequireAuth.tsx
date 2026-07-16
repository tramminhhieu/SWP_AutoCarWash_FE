import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import Modal from "../components/ui/Modal";

// Dùng cho các nút public (Booking Now, Select Plan...) cần login mới thực hiện được:
// đã login thì điều hướng thẳng, chưa login thì hiện popup xác nhận trước khi
// chuyển sang /login, thay vì tự động chuyển ngay không báo trước.
export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  function requireAuth(target: string) {
    if (isAuthenticated) {
      navigate(target);
    } else {
      setPendingTarget(target);
    }
  }

  const authModal = (
    <Modal
      isOpen={!!pendingTarget}
      onClose={() => setPendingTarget(null)}
      variant="confirm"
      title="Login Required"
      message="You need to log in to perform this action."
      confirmText="Log In"
      cancelText="Cancel"
      onConfirm={() => {
        navigate("/login", { state: { from: pendingTarget } });
        setPendingTarget(null);
      }}
    />
  );

  return { requireAuth, authModal };
}

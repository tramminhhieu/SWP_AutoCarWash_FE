import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // TODO: thay bằng form thật (email/password) gọi authApi.login()
  const handleMockLogin = () => {
    login();
    navigate("/profile");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-['Montserrat'] text-2xl font-bold text-[#141b2b]">
        Login
      </h1>
      <p className="mt-2 font-['Inter'] text-sm text-[#434655]">
        Form đăng nhập thật sẽ thêm sau. Tạm dùng nút bên dưới để test UI.
      </p>
      <button
        type="button"
        onClick={handleMockLogin}
        className="mt-6 w-full rounded-lg bg-[#1D4ED8] px-4 py-2 font-['Inter'] text-sm font-semibold text-white hover:bg-[#0037b0]"
      >
        Login (mock)
      </button>
    </div>
  );
}

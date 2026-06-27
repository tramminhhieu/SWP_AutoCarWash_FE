import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // author: Ngọc — thêm state cho form login thật
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: thay bằng form thật (email/password) gọi authApi.login()
  // author: Ngọc — handleMockLogin đổi thành handleLogin gọi API thật
  // const handleMockLogin = () => {
  //   login();
  //   navigate("/profile");
  // };
  const handleLogin = async () => {
    if (!identity.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(identity, password);
      navigate("/staff/queue");
    } catch {
      setError("Email/SĐT hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-['Montserrat'] text-2xl font-bold text-[#141b2b]">
        Login
      </h1>
      {/* form login */}
      <div className="mt-6 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Email hoặc số điện thoại"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-lg bg-[#1D4ED8] px-4 py-2 font-['Inter'] text-sm font-semibold text-white hover:bg-[#0037b0] disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
}

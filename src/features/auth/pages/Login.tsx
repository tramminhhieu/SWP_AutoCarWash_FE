import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { login } from "../api/authApi";
import { useAuth } from "../../../hooks/useAuth";
import { getApiErrorInfo } from "../../../lib/axiosClient";

// Regex kiểm tra định dạng email cơ bản
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Regex kiểm tra số điện thoại VN: bắt đầu bằng 0, theo sau 9 số (tổng 10 số)
const PHONE_REGEX = /^0\d{9}$/;

const Login = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");

  // Lỗi riêng từng field (AC-01.5: để trống)
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // Lỗi chung hiện trên cùng form (sai thông tin / tài khoản inactive)
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // trong component, ngay sau khai báo navigate
  const location = useLocation();
  const [successMessage] = useState<string | null>(
    (location.state as { registerSuccessMessage?: string })
      ?.registerSuccessMessage ?? null,
  );

  // Validate trước khi gọi API: chỉ check rỗng + format hợp lệ (email hoặc phone),
  // không tự đoán identity sai/đúng tài khoản - việc đó để BE xử lý
  const validate = (): boolean => {
    let isValid = true;
    setIdentityError(null);
    setPasswordError(null);

    if (!identity.trim()) {
      setIdentityError("Email hoặc Số điện thoại không được để trống");
      isValid = false;
    } else if (
      !EMAIL_REGEX.test(identity.trim()) &&
      !PHONE_REGEX.test(identity.trim())
    ) {
      setIdentityError("Vui lòng nhập đúng định dạng email hoặc số điện thoại");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Mật khẩu không được để trống");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await login({ identity: identity.trim(), password });
      loginWithToken(result.token);

      // AC-01: chuyển hướng về trang chủ kèm thông báo chào mừng (toast),
      // truyền qua route state để Home đọc và hiện toast rồi tự xóa
      navigate("/", {
        state: { loginSuccessMessage: result.message },
      });
    } catch (error) {
      const { errorCode, message } = getApiErrorInfo(error);

      // AC-01.4: tài khoản Inactive - BE trả message riêng, hiện đúng message đó
      // AC-01.2 + AC-01.3: sai mật khẩu hoặc tài khoản không tồn tại - dùng CHUNG 1 message
      // để không tiết lộ tài khoản có tồn tại hay không, đúng yêu cầu AC-01.3
      if (errorCode === "ACCOUNT_INACTIVE") {
        setFormError(message ?? "Tài khoản của bạn đã bị vô hiệu hóa.");
      } else {
        setFormError("Email/Số điện thoại hoặc mật khẩu không chính xác");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
        {/* Logo + tên brand - cùng nền trắng với form, không tách rời */}
        <div className="flex flex-col items-center pb-8">
          <img
            src="/favicon.png"
            alt="HydroLux"
            className="h-20 w-20 object-contain"
          />
          <h1 className=" font-headline text-headline-md font-bold">
            Welcome Back
          </h1>
          Đăng nhập để tiếp tục với{" "}
          <span className="font-bold text-2xl text-primary">HydroLux</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Thông báo đăng ký thành công, truyền từ Register.tsx qua route state */}
          {successMessage && (
            <div className="mb-4 rounded-lg border border-tertiary/30 bg-tertiary-container/10 px-4 py-3 text-body-md text-tertiary">
              {successMessage}
            </div>
          )}
          {/* Lỗi chung của form (sai thông tin / inactive) */}
          {formError && (
            <div className="mb-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
              {formError}
            </div>
          )}

          {/* Field Email/Phone - 1 field duy nhất */}
          <div className="mb-4">
            <label
              htmlFor="identity"
              className="mb-1.5 block text-body-md font-medium text-on-surface"
            >
              Email hoặc Số điện thoại
            </label>
            <input
              id="identity"
              type="text"
              autoComplete="username"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="Nhập email hoặc số điện thoại"
              className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors
                ${identityError ? "border-error" : "border-outline-variant focus:border-primary"}`}
            />
            {identityError && (
              <p className="mt-1.5 text-label-md text-error">{identityError}</p>
            )}
          </div>

          {/* Field Password */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="mb-1.5 block text-body-md font-medium text-on-surface"
              >
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-label-md font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors
                ${passwordError ? "border-error" : "border-outline-variant focus:border-primary"}`}
            />
            {passwordError && (
              <p className="mt-1.5 text-label-md text-error">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-5 w-full rounded-lg px-6 py-3 text-body-md font-semibold transition-colors
              ${
                isSubmitting
                  ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                  : "bg-primary text-on-primary hover:opacity-90"
              }`}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Login"}
          </button>

          <p className="mt-5 text-center text-body-md text-on-surface-variant">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};

export default Login;

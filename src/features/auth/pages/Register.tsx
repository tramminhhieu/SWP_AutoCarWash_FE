import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import type { RegisterFieldError } from "../types/auth";

// Regex kiểm tra định dạng email cơ bản (giống Login.tsx)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Regex kiểm tra số điện thoại VN: bắt đầu bằng 0, theo sau 9 số (tổng 10 số)
const PHONE_REGEX = /^0\d{9}$/;
const PHONE_MAX_LENGTH = 10;

const NAME_REGEX = /^[a-zA-ZÀ-ỹđĐ\s]+$/;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;

const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "mail.com",
];
const EMAIL_MAX_LENGTH = 100;

// AC-05: message dùng chung cho mọi trường bắt buộc bị bỏ trống
const REQUIRED_ERROR = "This field is required";

const Register = () => {
  const navigate = useNavigate();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Lỗi riêng từng field
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  // Lỗi chung hiện trên cùng form (lỗi không gắn được vào field cụ thể)
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate phía FE: required + format. Trùng email/phone (AC-02, AC-03) do BE check,
  // chỉ xử lý sau khi gọi API ở handleSubmit
  const validate = (): boolean => {
    let isValid = true;
    setLastNameError(null);
    setFirstNameError(null);
    setEmailError(null);
    setPhoneError(null);
    setBirthdayError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!lastName.trim()) {
      setLastNameError(REQUIRED_ERROR);
      isValid = false;
    } else if (!NAME_REGEX.test(lastName.trim())) {
      setLastNameError("Last name must contain letters only");
      isValid = false;
    } else if (lastName.trim().length < NAME_MIN_LENGTH) {
      setLastNameError(
        `Last name must be at least ${NAME_MIN_LENGTH} characters`,
      );
      isValid = false;
    } else if (lastName.trim().length > NAME_MAX_LENGTH) {
      setLastNameError(
        `Last name must not exceed ${NAME_MAX_LENGTH} characters`,
      );
      isValid = false;
    }

    if (!firstName.trim()) {
      setFirstNameError(REQUIRED_ERROR);
      isValid = false;
    } else if (!NAME_REGEX.test(firstName.trim())) {
      setFirstNameError("First name must contain letters only");
      isValid = false;
    } else if (firstName.trim().length < NAME_MIN_LENGTH) {
      setFirstNameError(
        `First name must be at least ${NAME_MIN_LENGTH} characters`,
      );
      isValid = false;
    } else if (firstName.trim().length > NAME_MAX_LENGTH) {
      setFirstNameError(
        `First name must not exceed ${NAME_MAX_LENGTH} characters`,
      );
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError(REQUIRED_ERROR);
      isValid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Invalid email format");
      isValid = false;
    } else {
      const domain = email.trim().split("@")[1];
      if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
        setEmailError(
          "Please use a common email provider (Gmail, Yahoo, Outlook, etc.)",
        );
        isValid = false;
      }
    }

    if (!phone.trim()) {
      setPhoneError(REQUIRED_ERROR);
      isValid = false;
    } else if (!PHONE_REGEX.test(phone.trim())) {
      setPhoneError("Invalid phone number");
      isValid = false;
    }

    if (!birthday) {
      setBirthdayError(REQUIRED_ERROR);
      isValid = false;
    } else if (new Date(birthday) > new Date()) {
      setBirthdayError("Invalid birthday");
      isValid = false;
    }

    if (!password) {
      setPasswordError(REQUIRED_ERROR);
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      isValid = false;
    } else if (password.length > 20) {
      setPasswordError("Password must not exceed 20 characters");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(REQUIRED_ERROR);
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Confirm password does not match");
      isValid = false;
    }

    return isValid;
  };

  // Map lỗi field BE trả về (email/phone trùng...) vào đúng state lỗi của field đó
  const applyServerFieldErrors = (errors: RegisterFieldError[]) => {
    errors.forEach((err) => {
      switch (err.field) {
        case "email":
          // AC-02: dùng message theo nghiệp vụ, không dùng message mặc định "Email đã tồn tại" của BE
          setEmailError(
            err.errorCode === "EMAIL_ALREADY_EXISTS"
              ? "This email is already in use. Please use another email or sign in."
              : err.message,
          );
          break;
        case "phone":
          // AC-03
          setPhoneError(
            err.errorCode === "PHONE_ALREADY_EXISTS"
              ? "This phone number is already in use."
              : err.message,
          );
          break;
        case "password":
          setPasswordError(err.message);
          break;
        default:
          setFormError(err.message);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        firstName: firstName.trim().replace(/\s+/g, " "),
        lastName: lastName.trim().replace(/\s+/g, " "),
        birthday,
        phone: phone.trim(),
        email: email.trim(),
        password,
      });

      // Đăng ký thành công: điều hướng sang Login kèm thông báo qua route state
      // (Login.tsx cần đọc location.state.registerSuccessMessage để hiển thị banner)
      navigate("/login", {
        state: {
          registerSuccessMessage:
            "Registration successful! Please sign in to continue.",
        },
      });
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      // BE trả mảng lỗi theo field khi errorCode = VALIDATION_FAILED (email/phone trùng...)
      const fieldErrors = (
        error as { response?: { data?: { errors?: RegisterFieldError[] } } }
      )?.response?.data?.errors;

      if (fieldErrors?.length) {
        applyServerFieldErrors(fieldErrors);
      } else {
        setFormError(message ?? "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
        {/* Logo + tên brand - cùng nền trắng với form, không tách rời */}
        <div className="flex flex-col items-center pb-8">
          <img
            src="/favicon-512x512.png"
            alt="HydroLux"
            className="h-20 w-20 object-contain"
          />
          <h1 className="font-headline text-headline-md font-bold">
            Create Account
          </h1>
          Sign up to get started with{" "}
          <span className="font-bold text-2xl text-primary">HydroLux</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Lỗi chung của form */}
          {formError && (
            <div className="mb-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
              {formError}
            </div>
          )}

          {/* Row: Last Name - First Name */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="lastName"
                className="mb-1.5 block text-body-md font-medium text-on-surface"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                maxLength={20}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors
                  ${lastNameError ? "border-error" : "border-outline-variant focus:border-primary"}`}
              />
              {lastNameError && (
                <p className="mt-1.5 text-label-md text-error">
                  {lastNameError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="mb-1.5 block text-body-md font-medium text-on-surface"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                maxLength={20}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors
                  ${firstNameError ? "border-error" : "border-outline-variant focus:border-primary"}`}
              />
              {firstNameError && (
                <p className="mt-1.5 text-label-md text-error">
                  {firstNameError}
                </p>
              )}
            </div>
          </div>

          {/* Row: Email - Phone */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-body-md font-medium text-on-surface"
              >
                Email
              </label>
              <input
                id="email"
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                maxLength={EMAIL_MAX_LENGTH}
                className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors
                  ${emailError ? "border-error" : "border-outline-variant focus:border-primary"}`}
              />
              {emailError && (
                <p className="mt-1.5 text-label-md text-error">{emailError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-body-md font-medium text-on-surface"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0123456789"
                maxLength={PHONE_MAX_LENGTH}
                className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors
                  ${phoneError ? "border-error" : "border-outline-variant focus:border-primary"}`}
              />
              {phoneError && (
                <p className="mt-1.5 text-label-md text-error">{phoneError}</p>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="mb-4">
            <label
              htmlFor="birthday"
              className="mb-1.5 block text-body-md font-medium text-on-surface"
            >
              Date of Birth
            </label>
            <input
              id="birthday"
              type="date"
              autoComplete="bday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={`w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors
    ${birthdayError ? "border-error" : "border-outline-variant focus:border-primary"}`}
            />

            {birthdayError && (
              <p className="mt-1.5 text-label-md text-error">{birthdayError}</p>
            )}
          </div>

          {/* Row: Password - Confirm Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-body-md font-medium text-on-surface"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={20}
                className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-body-md text-on-surface outline-none transition-colors
        ${passwordError ? "border-error" : "border-outline-variant focus:border-primary"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1.5 text-label-md text-error">{passwordError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-body-md font-medium text-on-surface"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={20}
                className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-body-md text-on-surface outline-none transition-colors
        ${confirmPasswordError ? "border-error" : "border-outline-variant focus:border-primary"}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="mt-1.5 text-label-md text-error">
                {confirmPasswordError}
              </p>
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
            {isSubmitting ? "Signing up..." : "Register"}
          </button>

          <p className="mt-5 text-center text-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};

export default Register;

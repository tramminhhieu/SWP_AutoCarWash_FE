import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  User as UserIcon,
  LogOut,
  UserPen,
  Calendar,
  Puzzle,
  Package,
  Receipt,
  HeartHandshake,
  Infinity as InfinityIcon,
} from "lucide-react";

import NotificationBell from "../features/crm/components/NotificationBell";

/**
 * Thông tin user hiển thị trên header.
 * firstName/lastName lấy trực tiếp từ bảng customer trong DB.
 * Chưa có avatar trong DB nên header luôn dùng icon user mặc định.
 */
export interface HeaderUser {
  name?: string;
  email?: string;
}

interface CustomerHeaderProps {
  isAuthenticated: boolean;
  user?: HeaderUser;
  onLogout?: () => void;
}

const NAV_LINKS = [
  { label: "Family", href: "/family" },
  { label: "Unlimited", href: "/subscription" },
];

const SERVICE_LINKS = [
  { label: "Add-on", href: "/add-ons", icon: Puzzle },
  { label: "Service Package", href: "/service-packages", icon: Package },
  {
    label: "Unlimited Subscription",
    href: "/subscription-plans?type=UNLIMIT",
    icon: InfinityIcon,
  },
  {
    label: "Family Subscription",
    href: "/subscriptions/family/plans",
    icon: HeartHandshake,
  },
];

export default function CustomerHeader({
  isAuthenticated,
  user,
  onLogout,
}: CustomerHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const serviceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        serviceRef.current &&
        !serviceRef.current.contains(event.target as Node)
      ) {
        setIsServiceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-margin-mobile md:px-margin-desktop">
        {/* Logo */}
        <Link
          to="/"
          className="font-heading text-3xl font-bold tracking-[-0.01em] text-primary"
        >
          HydroLux
        </Link>

        {/* Nav links - desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {/* Service dropdown */}
          <div ref={serviceRef} className="relative">
            <button
              type="button"
              onClick={() => setIsServiceOpen((prev) => !prev)}
              aria-expanded={isServiceOpen}
              className="flex items-center gap-1 font-body font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              Service
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isServiceOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isServiceOpen && (
              <div
                role="menu"
                className="absolute left-0 z-50 mt-2 w-56 rounded-lg border border-outline-variant bg-white/80 py-1 shadow-soft backdrop-blur-md"
              >
                {SERVICE_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 font-body text-sm text-on-surface hover:bg-surface-container-low"
                      onClick={() => setIsServiceOpen(false)}
                    >
                      <Icon
                        className="h-4 w-4 text-outline"
                        strokeWidth={1.75}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Các link còn lại */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: auth state */}
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-lg bg-primary-container px-4 py-2 font-body text-sm font-semibold text-on-primary shadow-soft transition-colors hover:bg-primary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg border border-secondary-container px-4 py-2 font-body text-sm font-semibold text-secondary-container transition-colors hover:bg-surface-container-high"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <NotificationBell />

              {/* Profile dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary">
                    <UserIcon className="h-4 w-4" strokeWidth={1.75} />
                  </div>

                  <span className="hidden flex-col items-start leading-tight sm:flex">
                    <span className="font-body text-sm font-semibold text-on-surface">
                      {user
                        ? (user.name ?? user.email ?? "Account")
                        : "Account"}
                    </span>
                  </span>

                  <ChevronDown
                    className={`h-4 w-4 text-outline transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-outline-variant bg-white/80 py-1 shadow-soft backdrop-blur-md"
                  >
                    <Link
                      to="/customer/profile"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 font-body text-sm text-on-surface hover:bg-surface-container-low"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserPen
                        className="h-4 w-4 text-outline"
                        strokeWidth={1.75}
                      />
                      My Profile
                    </Link>
                    <Link
                      to="/booking/history"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 font-body text-sm text-on-surface hover:bg-surface-container-low"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Calendar
                        className="h-4 w-4 text-outline"
                        strokeWidth={1.75}
                      />
                      My Booking
                    </Link>
                    <Link
                      to="/customer/transactions"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 font-body text-sm text-on-surface hover:bg-surface-container-low"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Receipt
                        className="h-4 w-4 text-outline"
                        strokeWidth={1.75}
                      />
                      My Transaction
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout?.();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left font-body text-sm text-error hover:bg-error-container"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.75} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

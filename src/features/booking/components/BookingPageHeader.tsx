import { Bell, CircleUserRound } from "lucide-react";

export function BookingPageHeader() {
  return (
    <header className="border-b border-outline-variant/30 bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-12 py-4">
        <span className="font-heading text-2xl font-bold tracking-[-0.6px] text-on-surface">
          HydroLux
        </span>
        <nav className="flex items-center gap-6">
          {["Service", "How It Works", "Family", "Review"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm font-medium tracking-[0.14px] text-on-surface-variant hover:text-on-surface"
            >
              {link}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button aria-label="Notifications" className="text-on-surface-variant hover:text-on-surface">
            <Bell className="size-5" />
          </button>
          <button aria-label="Profile" className="text-on-surface-variant hover:text-on-surface">
            <CircleUserRound className="size-6" />
          </button>

        </div>
      </div>
    </header>
  );
}

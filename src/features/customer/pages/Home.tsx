import { useEffect, useState } from "react";
import {
  Infinity as InfinityIcon,
  CheckCircle2,
  PiggyBank,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

// === ẢNH các section khác: tự import file ảnh thật vào đây khi có ===
import heroImg from "../../../assets/hero.jpg";
import servicePackageImg from "../../../assets/servicePackage.jpg";
import unlimitedSubscriptionImg from "../../../assets/unlimitedSubscription.jpg";
import familySubscriptionImg from "../../../assets/familySubscription.jpg";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Bấm "Booking Now" -> nếu chưa đăng nhập thì chuyển sang /login luôn (kèm "from"
  // để Login biết quay lại đúng trang đặt lịch sau khi đăng nhập thành công),
  // tránh việc cho qua /booking/location rồi mới bị PrivateRoute đá ngược lại
  const handleBookingNowClick = () => {
    if (isAuthenticated) {
      navigate("/booking/location");
    } else {
      navigate("/login", { state: { from: "/booking/location" } });
    }
  };

  // Đọc message thành công ngay lúc render lần đầu bằng lazy initializer của useState -
  // KHÔNG setState trong effect để tránh lỗi "set-state-in-effect" (cascading render)
  const [toastMessage, setToastMessage] = useState<string | null>(() => {
    const state = location.state as {
      loginSuccessMessage?: string;
      bookingSuccessMessage?: string;
    } | null;
    return state?.bookingSuccessMessage ?? state?.loginSuccessMessage ?? null;
  });

  // Effect này chỉ tương tác với router (external system) để dọn state khỏi history,
  // không gọi setState nên không vi phạm rule - chỉ chạy 1 lần lúc mount
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự ẩn toast sau 3 giây
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className="w-full bg-surface">
      {/* Toast thông báo thành công - cố định ở giữa màn hình, dùng Lime Green
          (tertiary) theo DESIGN.md vì đây là "Success state" */}
      {toastMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface-container-lowest px-8 py-8 shadow-xl max-w-sm w-full mx-4 text-center">
            <CheckCircle2 size={48} className="text-tertiary-fixed-dim" />
            <p className="text-headline-md font-semibold text-on-surface">
              Thành công!
            </p>
            <p className="text-body-md text-on-surface-variant">
              {toastMessage}
            </p>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="mt-2 w-full rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SECTION 1: HERO - Precision Care for Every Drive            */}
      {/* Ảnh nền phủ toàn section, làm mờ bằng overlay trắng để giữ  */}
      {/* độ đọc của chữ. Dùng "relative" để chứa ảnh "absolute".     */}
      {/* ========================================================== */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        {/* Ảnh nền - phủ kín section, nằm dưới cùng */}
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay trắng mờ để làm mờ ảnh, giữ chữ phía trên dễ đọc */}
        <div className="absolute inset-0 bg-surface/70" />

        {/* Nội dung chữ - ép sát mép trái của trình duyệt */}
        <div className="relative w-full px-margin-mobile md:px-margin-desktop py-16">
          <div className="max-w-xl text-left">
            <h1 className="font-heading text-headline-xl text-on-surface">
              Precision Care for
              <br />
              Every Drive
            </h1>
            <p className="mt-5 font-body text-body-lg text-on-surface-variant max-w-md">
              One session, and your car feels brand new again. A refined, fast,
              and dependable detailing experience — so you can get back on the
              road with confidence.
            </p>
            {/* Bấm vào sẽ check đăng nhập trước khi chuyển sang trang chọn Location */}
            <button
              type="button"
              onClick={handleBookingNowClick}
              className="mt-7 inline-block px-6 py-3 rounded-lg bg-primary text-on-primary font-body font-semibold text-sm"
            >
              Booking Now
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* SECTION 2: FLEXIBLE CARE - The Single Session                */}
      {/* ========================================================== */}
      <section className="max-w-page mx-auto px-margin-mobile md:px-margin-desktop py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Cột trái: eyebrow + nội dung + checklist + CTA */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full font-body text-label-md text-secondary">
              FLEXIBLE CARE
            </span>
            <h2 className="mt-3 font-heading text-headline-lg text-on-surface">
              The Service Package
            </h2>
            <p className="mt-4 font-body text-body-md text-on-surface-variant max-w-md">
              Every drive has its own story, and every story deserves its own
              level of care. Pick the package that matches your pace — light
              touch or full detail — with nothing to commit to beyond today.
            </p>

            {/* Checklist dùng SVG checkmark Lime Green theo DESIGN.md (tertiary-fixed-dim) */}
            <ul className="mt-5 space-y-3">
              {[
                "Complete exterior wash",
                "Wheel & tire conditioning",
                "Interior vacuum & wipe down",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    size={20}
                    className="text-tertiary-fixed-dim"
                    strokeWidth={2}
                  />
                  <span className="font-body text-body-md text-on-surface">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <button className="mt-7 px-6 py-3 rounded-lg bg-primary text-on-primary font-body font-semibold text-sm">
              Get Started
            </button>
          </div>

          {/* Cột phải: ảnh tunnel rửa xe kiểu vòm */}
          <div className="rounded-lg overflow-hidden w-full aspect-[4/3] shadow-[0_20px_50px_-8px_rgba(0,0,0,0.35)]">
            <img
              src={servicePackageImg}
              alt="Single session wash tunnel"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* SECTION 3: SHOWROOM STATUS - Unlimited Access                 */}
      {/* ========================================================== */}
      <section className="max-w-page mx-auto px-margin-mobile md:px-margin-desktop py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Cột trái: ảnh tunnel neon (đảo vị trí ảnh sang trái theo mockup) */}
          <div className="rounded-lg overflow-hidden w-full aspect-[4/3] shadow-[0_20px_50px_-8px_rgba(0,0,0,0.35)]">
            <img
              src={unlimitedSubscriptionImg}
              alt="Unlimited access neon wash tunnel"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Cột phải: eyebrow + nội dung + 2 feature card + CTA */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-secondary-fixed font-body text-label-md text-on-secondary-fixed-variant">
              MORE VALUE, EVERY VISIT
            </span>
            <h2 className="mt-3 font-heading text-headline-lg text-on-surface">
              Unlimited Subscription
            </h2>
            <p className="mt-4 font-body text-body-md text-on-surface-variant max-w-md">
              Keep your vehicle in flawless condition without watching the cost
              add up. Our unlimited plans grant full access to premium care,
              making every visit more valuable than the last.
            </p>

            {/* 2 feature card nền trắng, có shadow nhẹ để nổi bật */}
            <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-surface-container-lowest rounded-md p-4 shadow-soft">
                <InfinityIcon
                  size={20}
                  className="text-primary-container"
                  strokeWidth={2.2}
                />
                <p className="mt-2 font-body text-label-md text-on-surface">
                  Infinite Washes
                </p>
                <p className="mt-1 font-body text-label-sm text-on-surface-variant">
                  Come as often as you like
                </p>
              </div>

              <div className="bg-surface-container-lowest rounded-md p-4 shadow-soft">
                <PiggyBank
                  size={20}
                  className="text-primary-container"
                  strokeWidth={2.2}
                />
                <p className="mt-2 font-body text-label-md text-on-surface">
                  Fixed Monthly Cost
                </p>
                <p className="mt-1 font-body text-label-sm text-on-surface-variant">
                  No surprise charges, ever
                </p>
              </div>
            </div>

            <button className="mt-7 px-6 py-3 rounded-lg bg-on-surface text-on-primary font-body font-semibold text-sm">
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* SECTION 4: RIDE TOGETHER - The Family Plan                   */}
      {/* ========================================================== */}
      <section className="max-w-page mx-auto px-margin-mobile md:px-margin-desktop py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Cột trái: eyebrow + nội dung + badge list + CTA */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-secondary-fixed font-body text-label-md text-on-secondary-fixed-variant">
              RIDE TOGETHER
            </span>
            <h2 className="mt-3 font-heading text-headline-lg text-on-surface">
              Family Subscription
            </h2>
            <p className="mt-4 font-body text-body-md text-on-surface-variant max-w-md">
              Why pay separately when you can share one plan? Pick a single tier
              for your household, and every vehicle, every member, gets the same
              premium treatment at one combined cost.
            </p>

            {/* 3 badge pill nền xám nhạt */}
            <div className="mt-5 flex flex-wrap gap-3">
              {["Up to 5 Members", "Shared Billing", "Equal Benefits"].map(
                (label) => (
                  <span
                    key={label}
                    className="px-4 py-2 rounded-full bg-surface-container font-body text-[13px] font-medium text-on-surface-variant"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>

            <button className="mt-7 px-6 py-3 rounded-lg bg-primary text-on-primary font-body font-semibold text-sm">
              Get Started
            </button>
          </div>

          {/* Cột phải: ảnh tunnel hoàng hôn tím */}
          <div className="rounded-lg overflow-hidden w-full aspect-[4/3] shadow-[0_20px_50px_-8px_rgba(0,0,0,0.35)]">
            <img
              src={familySubscriptionImg}
              alt="Family subscription wash tunnel"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import {
  Infinity as InfinityIcon,
  CheckCircle2,
  PiggyBank,
} from "lucide-react";
import { Link } from "react-router-dom";

// === ẢNH các section khác: tự import file ảnh thật vào đây khi có ===
import heroImg from "../../../assets/hero.jpg";
import servicePackageImg from "../../../assets/servicePackage.jpg";
import unlimitedSubscriptionImg from "../../../assets/unlimitedSubscription.jpg";
// import familyPlanImg from "../../../assets/home/family-plan-sunset.jpg";

/**
 * Trang Home (Customer) - "Gloss & Gear"
 * Bám sát mockup Membership_Showcase__Immersive_Journey_v2.png
 * Header/Layout đã có sẵn ở CustomerLayout, page này chỉ render phần nội dung.
 *
 * Toàn bộ màu/font/spacing dùng class Tailwind được sinh từ token khai báo
 * trong index.css (@theme), theo đúng Tailwind CSS v4 - không dùng
 * tailwind.config.js.
 *
 * Nền trang: màu trắng đơn (bg-surface), không dùng gradient.
 *
 * Section Hero riêng: dùng heroImg làm ảnh nền phủ toàn section (absolute,
 * object-cover), phủ thêm lớp overlay trắng mờ (bg-surface/80) để giữ độ
 * đọc của chữ. Không còn khung ảnh bo góc bên cạnh text như layout ban đầu.
 */
const Home = () => {
  return (
    <div className="w-full bg-surface">
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
            {/* Bấm vào sẽ chuyển sang trang chọn Location (bước 1 flow đặt lịch) */}
            <Link
              to="/booking/location"
              className="mt-7 inline-block px-6 py-3 rounded-lg bg-primary text-on-primary font-body font-semibold text-sm"
            >
              Booking Now
            </Link>
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
          <div className="rounded-lg overflow-hidden w-full aspect-[4/3] shadow-soft">
            <img
              src={servicePackageImg}
              alt="Single session wash tunnel"
              className="w-full h-full object-cover"
            />
            <img
              src=""
              alt="Single session wash tunnel"
              className="w-full h-full object-cover bg-surface-container-high"
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
          <div className="rounded-lg overflow-hidden w-full aspect-[4/3] shadow-soft">
            <img
              src={unlimitedSubscriptionImg}
              alt="Unlimited access neon wash tunnel"
              className="w-full h-full object-cover"
            />
            <img
              src=""
              alt="Unlimited access neon wash tunnel"
              className="w-full h-full object-cover bg-inverse-surface"
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
          <div className="rounded-lg overflow-hidden w-full aspect-[4/3] shadow-soft">
            {/* TODO: thay bằng <img src={familyPlanImg} alt="Family plan sunset wash tunnel" className="w-full h-full object-cover" /> */}
            <img
              src=""
              alt="Family plan sunset wash tunnel"
              className="w-full h-full object-cover bg-surface-container-high"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

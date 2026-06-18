import { Globe, Share2 } from "lucide-react";

const FOOTER_LINKS = {
  Support: ["FAQ", "Contact Us"],
  Company: ["Privacy Policy", "Terms of Service"],
};

export function BookingPageFooter() {
  return (
    <footer className="border-t border-outline-variant/30 bg-white pt-px">
      <div className="mx-auto flex max-w-[1440px] items-start justify-between px-12 py-8">
        <div className="flex max-w-[320px] flex-col gap-4">
          <span className="font-heading text-xl font-bold text-on-surface">GLOSS &amp; GEAR</span>
          <p className="text-sm text-on-surface-variant">
            Hydro-Industrial grade automotive detailing and protection for the discerning
            enthusiast.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8">
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading} className="flex flex-col gap-2">
              <h5 className="text-sm font-bold tracking-[0.14px] text-on-surface">{heading}</h5>
              {links.map((link) => (
                <a key={link} href="#" className="text-xs font-semibold text-on-surface-variant">
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-outline-variant/10 px-12 py-6">
        <span className="text-xs font-semibold text-on-surface-variant">
          © 2024 HydroLux Automotive. All rights reserved.
        </span>
        <div className="flex items-center gap-6">
          <Globe className="size-5 text-on-surface-variant" />
          <Share2 className="size-[18px] text-on-surface-variant" />
        </div>
      </div>
    </footer>
  );
}

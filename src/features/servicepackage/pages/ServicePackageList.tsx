import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { formatCurrency } from "../../../utils";
import { getAll } from "../api/servicePackageApi";
import type { ServicePackage } from "../types/servicePackage";

/** 1 card gói dịch vụ - button luôn nằm sát đáy card dù description dài/ngắn khác nhau. */
function PackageCard({
  pkg,
  allAddons,
  onSelect,
}: {
  pkg: ServicePackage;
  allAddons: string[];
  onSelect: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-md border border-outline-variant/30 bg-surface-container-low p-8 shadow-soft">
      <div className="flex-1">
        <h3 className="font-heading text-headline-md font-bold text-on-surface">
          {pkg.name}
        </h3>
        <p className="mt-2 font-body text-body-md text-on-surface-variant">
          {pkg.description}
        </p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="font-heading text-headline-md font-bold text-on-surface">
            {formatCurrency(pkg.basePrice)}
          </span>
          <span className="font-body text-body-md text-on-surface-variant">
            /wash
          </span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-surface-container px-3 py-1.5">
          <Clock size={14} className="text-on-surface-variant" />
          <span className="font-body text-label-sm font-medium text-on-surface-variant">
            {pkg.durationMinutes} min
          </span>
        </div>

        {/* Hiện đủ toàn bộ addon của hệ thống (allAddons) - gói nào không có thì hiện X đỏ
            thay vì ẩn đi, để dễ so sánh ngang giữa 3 cột như 1 bảng so sánh */}
        <ul className="mt-6 space-y-2">
          {allAddons.map((addon) => {
            const isIncluded = pkg.addons.includes(addon);
            return (
              <li key={addon} className="flex items-center gap-2.5">
                {isIncluded ? (
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-tertiary-fixed-dim"
                    strokeWidth={2}
                  />
                ) : (
                  <XCircle
                    size={16}
                    className="shrink-0 text-error"
                    strokeWidth={2}
                  />
                )}
                <span
                  className={
                    isIncluded
                      ? "font-body text-body-sm text-on-surface"
                      : "font-body text-body-sm text-on-surface-variant"
                  }
                >
                  {addon}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="mt-8 w-full rounded-lg bg-primary px-6 py-3 text-center font-body text-sm font-semibold text-on-primary"
      >
        Select {pkg.name}
      </button>
    </div>
  );
}

export default function ServicePackageList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getAll()
      .then((data) => {
        if (isMounted) setPackages(data);
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load service packages. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Gộp toàn bộ tên addon xuất hiện ở bất kỳ gói nào -> dùng làm danh sách "đầy đủ" để so sánh
  // ngang giữa 3 gói (gói nào không có addon này thì hiện X đỏ thay vì ẩn dòng đó đi)
  const allAddons = Array.from(new Set(packages.flatMap((pkg) => pkg.addons)));

  // Bấm "Select" -> bắt đầu luồng đặt lịch từ bước chọn station, chưa gắn packageId cụ thể.
  // Tái dùng đúng pattern check-login của nút "Booking Now" ở Home.tsx: chưa đăng nhập
  // thì chuyển sang /login kèm "from" để quay lại đúng bước chọn station sau khi login.
  function handleSelectPackage() {
    if (isAuthenticated) {
      navigate("/booking/location");
    } else {
      navigate("/login", { state: { from: "/booking/location" } });
    }
  }

  return (
    <div className="max-w-page mx-auto px-margin-mobile py-20 md:px-margin-desktop">
      <div className="text-center">
        <h1 className="font-heading text-headline-lg text-on-surface">
          Service Packages
        </h1>
        <p className="mt-3 font-body text-body-md text-on-surface-variant">
          Choose the right level of care for your vehicle.
        </p>
      </div>

      <div className="mt-12">
        {error ? (
          <div className="flex h-48 items-center justify-center text-base text-error">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            Loading...
          </div>
        ) : packages.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-base text-outline">
            No service packages available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                allAddons={allAddons}
                onSelect={handleSelectPackage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

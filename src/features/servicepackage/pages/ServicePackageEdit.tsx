import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { updateServicePackage } from "../api/servicePackageApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import ServicePackageForm from "../components/ServicePackageForm";
import type { ServicePackageFormData } from "../components/ServicePackageForm";
import type { ServicePackage } from "../types/servicePackage";

export default function ServicePackageEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { servicePackageId } = useParams<{ servicePackageId: string }>();

  /* Lấy package data từ location.state (truyền từ ServicePackageList khi bấm Edit) */
  const pkg = (location.state as { pkg?: ServicePackage })?.pkg ?? null;

  const [apiError, setApiError] = useState<string | null>(null);

  /* Không có data package → redirect về list (user vào thẳng URL mà không qua list) */
  useEffect(() => {
    if (!pkg) {
      navigate("/admin/service-packages", { replace: true });
    }
  }, [pkg, navigate]);

  /* Gọi API update package */
  const handleUpdate = async (data: ServicePackageFormData) => {
    setApiError(null);
    const id = Number(servicePackageId);

    try {
      const result = await updateServicePackage(id, {
        name: data.name,
        basePrice: data.basePrice,
        durationMinutes: data.durationMinutes,
        description: data.description,
        addonIds: data.addonIds,
      });
      navigate("/admin/service-packages", {
        state: {
          successMessage: `Package "${result.name}" updated successfully`,
        },
      });
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setApiError(message ?? "Unable to update package. Please try again.");
      throw error;
    }
  };

  /* Chưa có data → không render (đang redirect) */
  if (!pkg) return null;

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile py-20 md:px-margin-desktop">
      <h1 className="font-headline text-headline-xl text-on-surface">
        Edit Service Package
      </h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Update package details and included services.
      </p>

      <div className="mt-8">
        <ServicePackageForm
          initialData={{
            name: pkg.name,
            basePrice: pkg.basePrice,
            durationMinutes: pkg.durationMinutes,
            description: pkg.description,
            addonIds: pkg.addonIds,
          }}
          onSubmit={handleUpdate}
          onCancel={() => navigate("/admin/service-packages")}
          submitLabel="Update Package"
          apiError={apiError}
        />
      </div>
    </div>
  );
}

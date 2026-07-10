import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createServicePackage } from "../api/servicePackageApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import ServicePackageForm from "../components/ServicePackageForm";
import type { ServicePackageFormData } from "../components/ServicePackageForm";

export default function ServicePackageCreate() {
  const navigate = useNavigate();

  const [apiError, setApiError] = useState<string | null>(null);

  /* Gọi API tạo package — truyền vào form qua onSubmit */
  const handleCreate = async (data: ServicePackageFormData) => {
    setApiError(null);
    try {
      const result = await createServicePackage({
        name: data.name,
        basePrice: data.basePrice,
        description: data.description,
        addonIds: data.addonIds,
      });
      navigate("/admin/service-packages", {
        state: {
          successMessage: `Package "${result.name}" created successfully`,
        },
      });
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      setApiError(message ?? "Unable to create package. Please try again.");
      throw error;
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile py-20 md:px-margin-desktop">
      <h1 className="font-headline text-headline-xl text-on-surface">
        Create Service Package
      </h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Bundle add-on services into a package with a fixed price.
      </p>

      <div className="mt-8">
        <ServicePackageForm
          onSubmit={handleCreate}
          onCancel={() => navigate("/admin/service-packages")}
          submitLabel="Save Package"
          apiError={apiError}
        />
      </div>
    </div>
  );
}

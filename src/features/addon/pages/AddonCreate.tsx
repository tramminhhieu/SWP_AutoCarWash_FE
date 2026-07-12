import { useNavigate } from "react-router-dom";
import AddonForm from "../components/AddonForm";
import { createAddonService } from "../api/addonApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import type { CreateAddonRequest } from "../types/addon";

export default function AddonCreate() {
  const navigate = useNavigate();

  /* Callback truyền cho AddonForm — gọi API create, trả message cho form biết thành công */
  const handleCreate = async (data: CreateAddonRequest): Promise<string> => {
    try {
      const result = await createAddonService(data);
      const msg = `Addon "${result.name}" created successfully`;
      navigate("/admin/add-ons", { state: { successMessage: msg } });
      return msg;
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      throw new Error(message ?? "Unable to create addon. Please try again.", {
        cause: error,
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile py-20 md:px-margin-desktop">
      <h1 className="font-headline text-headline-xl text-on-surface">
        Create New Add-on
      </h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Add a new supplementary service for customers to enhance their wash
        experience.
      </p>

      <div className="mt-8">
        <AddonForm
          onSubmit={handleCreate}
          onCancel={() => navigate("/admin/add-ons")}
          submitLabel="Save Add-on"
        />
      </div>
    </div>
  );
}

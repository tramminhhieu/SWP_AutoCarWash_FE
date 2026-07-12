import { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import AddonForm from "../components/AddonForm";
import { updateAddonService } from "../api/addonApi";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import type { AddonService, CreateAddonRequest } from "../types/addon";

export default function AddonEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addonId } = useParams<{ addonId: string }>();

  /* Lấy addon data từ route state (truyền từ AddonList, KHÔNG gọi API mới — AC-15.2) */
  const addon = (location.state as { addon?: AddonService })?.addon;

  /* Không có data trong state (vd: user truy cập trực tiếp URL) → về lại list */
  useEffect(() => {
    if (!addon) {
      navigate("/admin/add-ons", { replace: true });
    }
  }, [addon, navigate]);

  /* Callback truyền cho AddonForm — gọi API update */
  const handleUpdate = async (data: CreateAddonRequest): Promise<string> => {
    const addonServiceId = Number(addonId);
    try {
      const result = await updateAddonService(addonServiceId, data);
      const msg = `Addon "${result.name}" updated successfully`;
      navigate("/admin/add-ons", { state: { successMessage: msg } });
      return msg;
    } catch (error) {
      const { message } = getApiErrorInfo(error);
      throw new Error(message ?? "Unable to update addon. Please try again.", {
        cause: error,
      });
    }
  };

  /* Guard: chờ redirect nếu không có data */
  if (!addon) return null;

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile py-20 md:px-margin-desktop">
      <h1 className="font-headline text-headline-xl text-on-surface">
        Edit Add-on
      </h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Update details for{" "}
        <strong className="text-on-surface">{addon.name}</strong>.
      </p>

      <div className="mt-8">
        <AddonForm
          initialData={addon}
          onSubmit={handleUpdate}
          onCancel={() => navigate("/admin/add-ons")}
          submitLabel="Update Add-on"
        />
      </div>
    </div>
  );
}

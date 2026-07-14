import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SystemSettingForm from "../components/SystemSettingForm";
import { getAllSettings } from "../api/systemSettingApi";
import type { SystemSetting } from "../types/systemSetting";

export default function SystemSettingEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Ưu tiên lấy setting từ router state (navigate từ list) để tránh gọi API thừa
  const [setting, setSetting] = useState<SystemSetting | null>(
    location.state?.setting ?? null,
  );
  const [isLoading, setIsLoading] = useState(!location.state?.setting);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fallback khi truy cập URL trực tiếp (không có router state)
  useEffect(() => {
    if (setting) return;
    if (!id) {
      navigate("/admin/system-settings");
      return;
    }

    getAllSettings()
      .then((data) => {
        const flat = Object.entries(data).flatMap(([cat, settings]) =>
          settings.map((s) => ({ ...s, category: cat })),
        );
        const found = flat.find((s) => s.id === Number(id));
        if (found) {
          setSetting(found);
        } else {
          setLoadError("Setting not found.");
        }
      })
      .catch(() => setLoadError("Failed to load setting. Please try again."))
      .finally(() => setIsLoading(false));
  }, [id, setting, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-margin-mobile py-12 md:px-margin-desktop">
        <h1 className="font-headline text-headline-xl text-on-surface">
          Edit Setting
        </h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">
          Update the value for this system configuration rule.
        </p>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-base text-outline">
              Loading...
            </div>
          ) : loadError ? (
            <div className="flex h-48 items-center justify-center text-base text-error">
              {loadError}
            </div>
          ) : setting ? (
            <SystemSettingForm
              mode="edit"
              setting={setting}
              onSuccess={(msg) =>
                navigate("/admin/system-settings", {
                  state: {
                    successMessage: msg ?? "Setting updated successfully!",
                  },
                })
              }
              onCancel={() => navigate("/admin/system-settings")}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

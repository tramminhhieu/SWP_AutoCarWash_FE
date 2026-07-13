import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SystemSettingForm from "../components/SystemSettingForm";
import { getAllSettings } from "../api/systemSettingApi";

export default function SystemSettingCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);

  // Lấy danh sách category động để populate dropdown trong form
  useEffect(() => {
    getAllSettings()
      .then((data) => setCategories(Object.keys(data)))
      .catch(() => {
        /* form vẫn hoạt động, chỉ thiếu dropdown category */
      });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-margin-mobile py-12 md:px-margin-desktop">
        <h1 className="font-headline text-headline-xl text-on-surface">
          Add New Setting
        </h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">
          Declare a new system rule without requiring a SQL script.
        </p>

        <div className="mt-8">
          <SystemSettingForm
            mode="create"
            categories={categories}
            onSuccess={(msg) =>
              navigate("/admin/system-settings", {
                state: {
                  successMessage: msg ?? "Setting created successfully!",
                },
              })
            }
            onCancel={() => navigate("/admin/system-settings")}
          />
        </div>
      </div>
    </main>
  );
}

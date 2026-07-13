import { useEffect, useState } from "react";
import { Plus, Settings } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { getAllSystemSettings } from "../api/systemSettingApi";
import type { SystemSettingsByCategory } from "../types/systemSetting";
import SettingRow from "../components/SettingRow";
import SystemSettingForm from "../components/SystemSettingForm";

// API-35-01: data đã được BE gom theo category -> tự sinh Tab từ Object.keys(data), không cần
// hardcode danh sách category ở FE (đúng gợi ý thiết kế trong tài liệu API-35).
export default function SystemSettingList() {
  const [settings, setSettings] = useState<SystemSettingsByCategory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllSystemSettings();
        if (cancelled) return;
        setSettings(data);
        const categories = Object.keys(data);
        setActiveTab((prev) => prev ?? categories[0] ?? null);
      } catch {
        if (cancelled) return;
        setError("Unable to load system settings. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = Object.keys(settings);

  return (
    <div className="mx-auto max-w-container-max px-4 py-20 md:px-12">
      <div className="text-center">
        <h1 className="font-heading text-headline-lg text-on-surface">
          System Settings
        </h1>
        <p className="mt-3 font-body text-body-md text-on-surface-variant">
          Manage global configuration rules used across the system
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-colors hover:bg-primary/90"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add New Setting
        </button>
      </div>

      <div className="mt-8">
        {error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-error/20 bg-error-container/10 px-6 py-16 text-center">
            <p className="text-body-lg font-medium text-error">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md border border-error/30 px-4 py-2 text-body-md font-medium text-error transition-colors hover:bg-error-container"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-surface-container-high"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
            <Settings size={40} className="text-on-surface-variant/40" />
            <p className="mt-4 text-body-lg font-medium text-on-surface">
              No system settings configured
            </p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Click &quot;Add New Setting&quot; to create the first one.
            </p>
          </div>
        ) : (
          <>
            {/* Tab bar - tự sinh từ Object.keys(data), thêm category mới trong DB thì tự thêm Tab */}
            <div className="flex flex-wrap gap-2 border-b border-outline-variant pb-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveTab(category)}
                  className={`rounded-full px-4 py-2 text-label-md font-semibold transition-colors ${
                    activeTab === category
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {(settings[activeTab ?? categories[0]] ?? []).map((setting) => (
                <SettingRow key={setting.id} setting={setting} />
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        variant="custom"
        size="lg"
      >
        <SystemSettingForm
          existingCategories={categories}
          onCancel={() => setIsCreateOpen(false)}
          onCreated={(created) => {
            setSettings((prev) => {
              const bucket = prev[created.category] ?? [];
              return {
                ...prev,
                [created.category]: [...bucket, created],
              };
            });
            setActiveTab(created.category);
            setIsCreateOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

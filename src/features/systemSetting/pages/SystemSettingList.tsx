import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Search } from "lucide-react";
import { getAllSettings } from "../api/systemSettingApi";
import type { SystemSetting } from "../types/systemSetting";

const DATA_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  NUMBER: {
    label: "Number",
    className: "text-secondary border-secondary/20 bg-secondary-container/20",
  },
  STRING: {
    label: "String",
    className:
      "text-on-surface-variant border-outline-variant/50 bg-surface-container",
  },
  BOOLEAN: {
    label: "Boolean",
    className: "text-primary border-primary/20 bg-primary-container/20",
  },
};

export default function SystemSettingList() {
  const navigate = useNavigate();
  const [grouped, setGrouped] = useState<Record<string, SystemSetting[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    getAllSettings()
      .then(setGrouped)
      .catch(() =>
        setError("Failed to load system settings. Please try again."),
      )
      .finally(() => setIsLoading(false));
  }, []);

  // Flatten tất cả settings + gắn thêm category từ outer key của grouped response
  const allSettings: SystemSetting[] = useMemo(
    () =>
      Object.entries(grouped).flatMap(([cat, settings]) =>
        settings.map((s) => ({ ...s, category: cat })),
      ),
    [grouped],
  );

  const categories = useMemo(() => Object.keys(grouped), [grouped]);

  // Filter client-side: theo category + search key/description
  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return allSettings.filter((s) => {
      const matchCat =
        selectedCategory === "all" || s.category === selectedCategory;
      const matchSearch =
        !q ||
        s.setting_key.includes(q) ||
        s.description?.toUpperCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allSettings, selectedCategory, search]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
              System Settings
            </h1>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Configure system-wide rules and parameters. Changes take effect
            immediately.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/system-settings/new")}
          className="flex items-center gap-2 rounded-[8px] bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Add New Setting
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1" style={{ minWidth: "240px" }}>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by key or description..."
            className="w-full rounded-[8px] border border-outline-variant bg-white py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-[8px] border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {!isLoading && !error && (
          <span className="text-sm text-on-surface-variant">
            {filtered.length} of {allSettings.length} settings
          </span>
        )}
      </div>

      {/* Table */}
      {error ? (
        <div className="flex h-48 items-center justify-center text-base text-error">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          Loading settings...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-base text-outline">
          No settings found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-outline-variant/50 bg-white shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low/60">
                <th className="px-6 py-4 text-left text-label-md uppercase tracking-wide text-on-surface-variant">
                  Setting Key
                </th>

                <th className="px-6 py-4 text-left text-label-md uppercase tracking-wide text-on-surface-variant">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-label-md uppercase tracking-wide text-on-surface-variant">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-label-md uppercase tracking-wide text-on-surface-variant">
                  Value
                </th>
                <th className="px-6 py-4 text-left text-label-md uppercase tracking-wide text-on-surface-variant">
                  Description
                </th>
                <th className="px-6 py-4 text-right text-label-md uppercase tracking-wide text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((setting, idx) => {
                const badge =
                  DATA_TYPE_BADGE[setting.data_type] ?? DATA_TYPE_BADGE.STRING;
                const isLast = idx === filtered.length - 1;
                return (
                  <tr
                    key={setting.id}
                    className={`transition-colors hover:bg-surface-container-low/40 ${!isLast ? "border-b border-outline-variant/30" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-on-surface">
                        {setting.setting_key}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full border border-outline-variant/40 bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                        {setting.category ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {setting.data_type === "BOOLEAN" ? (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            setting.setting_value === "true"
                              ? "border-tertiary-container/30 bg-tertiary-fixed/20 text-tertiary-container"
                              : "border-outline-variant/50 bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {setting.setting_value === "true"
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      ) : (
                        <span className="text-base text-on-surface">
                          {setting.setting_value}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[280px] px-6 py-4">
                      <span className="line-clamp-2 text-base text-on-surface-variant">
                        {setting.description || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          navigate(
                            `/admin/system-settings/${setting.id}/edit`,
                            {
                              state: { setting },
                            },
                          )
                        }
                        className="flex items-center gap-1.5 rounded-md border border-outline-variant/30 px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

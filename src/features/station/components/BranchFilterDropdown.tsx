import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getProvinces, getCommunesByProvince } from "../../station/api/addressApi";
import { getStationsByCommune } from "../../station/api/stationApi";
import type { Province, Commune } from "../../station/types/address";
import type { Station } from "../../station/types/station";

export type BranchFilterSelection = {
  level: "province" | "commune" | "station";
  id: number;
} | null;

interface BranchFilterDropdownProps {
  onChange: (selection: BranchFilterSelection) => void;
}

type View = "province" | "commune" | "station";

// Filter chi nhánh gộp thành 1 dropdown duy nhất, điều hướng kiểu drill-in
// từng bước: mở ra thấy list Province -> bấm 1 Province thì panel chuyển
// hẳn sang list Commune của tỉnh đó (kèm lựa chọn "All branches in
// <province>" để nhảy cấp) -> tương tự khi vào Commune. Mỗi dòng chỉ có
// đúng 1 hành động (drill vào hoặc chọn), không còn chevron/label lẫn lộn
// trong cùng 1 dòng như bản trước.
export default function BranchFilterDropdown({
  onChange,
}: BranchFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communesByProvince, setCommunesByProvince] = useState<
    Record<number, Commune[]>
  >({});
  const [stationsByCommune, setStationsByCommune] = useState<
    Record<number, Station[]>
  >({});
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  const [view, setView] = useState<View>("province");
  const [activeProvince, setActiveProvince] = useState<Province | null>(null);
  const [activeCommune, setActiveCommune] = useState<Commune | null>(null);

  const [selectedLabel, setSelectedLabel] = useState("All branches");
  const [selectedValue, setSelectedValue] =
    useState<BranchFilterSelection>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => {
        // Không chặn dropdown nếu load danh sách tỉnh/thành lỗi.
      });
  }, []);

  function resetNavigation() {
    setView("province");
    setActiveProvince(null);
    setActiveCommune(null);
  }

  function close() {
    setIsOpen(false);
    resetNavigation();
  }

  function drillIntoProvince(province: Province) {
    setActiveProvince(province);
    setView("commune");
    if (!communesByProvince[province.id]) {
      setIsLoadingCommunes(true);
      getCommunesByProvince(province.id)
        .then((res) =>
          setCommunesByProvince((prev) => ({ ...prev, [province.id]: res })),
        )
        .catch(() => {})
        .finally(() => setIsLoadingCommunes(false));
    }
  }

  function drillIntoCommune(commune: Commune) {
    setActiveCommune(commune);
    setView("station");
    if (!stationsByCommune[commune.id]) {
      setIsLoadingStations(true);
      getStationsByCommune(commune.id)
        .then((res) =>
          setStationsByCommune((prev) => ({ ...prev, [commune.id]: res })),
        )
        .catch(() => {})
        .finally(() => setIsLoadingStations(false));
    }
  }

  function goBack() {
    if (view === "station") {
      setView("commune");
      setActiveCommune(null);
    } else if (view === "commune") {
      setView("province");
      setActiveProvince(null);
    }
  }

  function isSameSelection(
    a: BranchFilterSelection,
    b: BranchFilterSelection,
  ) {
    if (a === null || b === null) return a === b;
    return a.level === b.level && a.id === b.id;
  }

  function selectAndClose(selection: BranchFilterSelection, label: string) {
    // Chọn lại đúng giá trị đang có (vd bấm "All branches" khi đã ở "All
    // branches") là no-op - giống <select> native chỉ bắn onChange khi giá
    // trị thực sự đổi. Nếu vẫn gọi onChange, state ở component cha không đổi
    // (React bail-out) nên effect fetch không chạy lại, nhưng isLoading đã
    // bị set true từ trước đó thì không bao giờ được set lại false -> trang
    // kẹt vĩnh viễn ở màn hình loading.
    if (isSameSelection(selection, selectedValue)) {
      close();
      return;
    }
    setSelectedValue(selection);
    setSelectedLabel(label);
    onChange(selection);
    close();
  }

  const rowClass =
    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface"
      >
        Branch: {selectedLabel}
        <ChevronDown
          className={`h-4 w-4 text-outline transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-lg border border-outline-variant bg-white py-1 shadow-soft"
        >
          {view === "province" && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => selectAndClose(null, "All branches")}
                className={rowClass}
              >
                All branches
              </button>
              <div className="my-1 border-t border-outline-variant" />
              {provinces.map((province) => (
                <button
                  key={province.id}
                  type="button"
                  role="menuitem"
                  onClick={() => drillIntoProvince(province)}
                  className={rowClass}
                >
                  {province.provinceName}
                  <ChevronRight className="h-4 w-4 shrink-0 text-outline" />
                </button>
              ))}
            </>
          )}

          {view === "commune" && activeProvince && (
            <>
              <button
                type="button"
                onClick={goBack}
                className={`${rowClass} font-semibold text-on-surface-variant`}
              >
                <span className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  selectAndClose(
                    { level: "province", id: activeProvince.id },
                    activeProvince.provinceName,
                  )
                }
                className={rowClass}
              >
                All branches in {activeProvince.provinceName}
              </button>
              <div className="my-1 border-t border-outline-variant" />
              {isLoadingCommunes ? (
                <div className="px-3 py-2 text-sm text-outline">
                  Đang tải...
                </div>
              ) : (
                (communesByProvince[activeProvince.id] ?? []).map(
                  (commune) => (
                    <button
                      key={commune.id}
                      type="button"
                      role="menuitem"
                      onClick={() => drillIntoCommune(commune)}
                      className={rowClass}
                    >
                      {commune.communeName}
                      <ChevronRight className="h-4 w-4 shrink-0 text-outline" />
                    </button>
                  ),
                )
              )}
            </>
          )}

          {view === "station" && activeCommune && (
            <>
              <button
                type="button"
                onClick={goBack}
                className={`${rowClass} font-semibold text-on-surface-variant`}
              >
                <span className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  selectAndClose(
                    { level: "commune", id: activeCommune.id },
                    activeProvince
                      ? `${activeProvince.provinceName} › ${activeCommune.communeName}`
                      : activeCommune.communeName,
                  )
                }
                className={rowClass}
              >
                All branches in {activeCommune.communeName}
              </button>
              <div className="my-1 border-t border-outline-variant" />
              {isLoadingStations ? (
                <div className="px-3 py-2 text-sm text-outline">
                  Đang tải...
                </div>
              ) : (
                (stationsByCommune[activeCommune.id] ?? []).map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      selectAndClose(
                        { level: "station", id: station.id },
                        activeProvince
                          ? `${activeProvince.provinceName} › ${activeCommune.communeName} › ${station.stationName}`
                          : station.stationName,
                      )
                    }
                    className={rowClass}
                  >
                    {station.stationName}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

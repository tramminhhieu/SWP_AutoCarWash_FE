import { useEffect, useState } from "react";
import Loading from "../../../components/ui/Loading";
import StationCard from "../../station/components/StationCard";
import {
  getProvinces,
  getCommunesByProvince,
} from "../../station/api/addressApi";
import { getStationsByCommune } from "../../station/api/stationApi";
import type { Province, Commune } from "../../station/types/address";
import type { Station } from "../../station/types/station";

interface ListItem {
  id: number;
  label: string;
}

interface ListColumnProps {
  title: string;
  items: ListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
  isDisabled: boolean;
  emptyMessage: string;
  disabledMessage: string;
}

// Cột chọn dạng list có chevron, dùng nội bộ cho 2 cột PROVINCE/CITY và COMMUNE
// (chi tiết triển khai riêng của AddressSelector, không export ra ngoài)
const ListColumn = ({
  title,
  items,
  selectedId,
  onSelect,
  isLoading,
  isDisabled,
  emptyMessage,
  disabledMessage,
}: ListColumnProps) => {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest transition-opacity ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <div className="border-b border-outline-variant px-5 py-4">
        <span className="text-label-md uppercase tracking-wide text-on-surface-variant">
          {title}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isDisabled ? (
          <p className="px-5 py-6 text-body-md text-on-surface-variant">
            {disabledMessage}
          </p>
        ) : isLoading ? (
          <Loading rows={4} />
        ) : items.length === 0 ? (
          <p className="px-5 py-6 text-body-md text-on-surface-variant">
            {emptyMessage}
          </p>
        ) : (
          <ul className="p-2">
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-body-lg transition-colors
                      ${
                        isSelected
                          ? "border-2 border-primary bg-primary-container/7"
                          : "text-on-surface hover:bg-surface-container-low"
                      }`}
                  >
                    <span className={isSelected ? "font-medium" : ""}>
                      {item.label}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={
                        isSelected ? "text-outline" : "text-outline-variant"
                      }
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

interface AddressSelectorProps {
  /** Callback khi chọn xong station — caller tự quyết định xử lý tiếp (navigate, setState...) */
  onStationSelect: (station: Station) => void;
}

// AddressSelector: chọn địa chỉ theo 3 cấp Province -> Commune -> Station,
// hiển thị dạng 3 cột (đúng mockup "Find a Service Center").
// Mỗi lần chọn 1 cấp sẽ tự gọi API lấy danh sách cấp kế tiếp (API-01-01, API-01-02, API-01-03).
// Không tự navigate — trả station về qua callback để caller quyết định.
const AddressSelector = ({ onStationSelect }: AddressSelectorProps) => {
  // --- State cho cột Province ---
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
    null,
  );
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [provinceError, setProvinceError] = useState<string | null>(null);

  // --- State cho cột Commune ---
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedCommuneId, setSelectedCommuneId] = useState<number | null>(
    null,
  );
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [communeError, setCommuneError] = useState<string | null>(null);

  // --- State cho cột Station ---
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null,
  );
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);

  // Load danh sách provinces ngay khi vào trang (API-01-01)
  useEffect(() => {
    let ignore = false;

    const loadProvinces = async () => {
      setIsLoadingProvinces(true);
      setProvinceError(null);
      try {
        const data = await getProvinces();
        if (!ignore) setProvinces(data);
      } catch {
        if (!ignore) {
          setProvinceError("Failed to load provinces. Please try again.");
        }
      } finally {
        if (!ignore) setIsLoadingProvinces(false);
      }
    };

    loadProvinces();

    // Cờ để bỏ qua kết quả nếu component đã unmount trước khi API trả về
    return () => {
      ignore = true;
    };
  }, []);

  // Khi chọn 1 province -> gọi API lấy communes (API-01-02), reset commune/station
  const handleSelectProvince = async (provinceId: number) => {
    setSelectedProvinceId(provinceId);
    setSelectedCommuneId(null);
    setCommunes([]);
    setStations([]);
    setSelectedStationId(null);
    setCommuneError(null);
    setStationError(null);

    setIsLoadingCommunes(true);
    try {
      const data = await getCommunesByProvince(provinceId);
      setCommunes(data);
    } catch {
      setCommuneError("Failed to load communes. Please try again.");
    } finally {
      setIsLoadingCommunes(false);
    }
  };

  // Khi chọn 1 commune -> gọi API lấy stations (API-01-03), reset station
  const handleSelectCommune = async (communeId: number) => {
    setSelectedCommuneId(communeId);
    setStations([]);
    setSelectedStationId(null);
    setStationError(null);

    setIsLoadingStations(true);
    try {
      const data = await getStationsByCommune(communeId);
      setStations(data);
    } catch {
      setStationError("Failed to load service centers. Please try again.");
    } finally {
      setIsLoadingStations(false);
    }
  };

  // Khi chọn 1 station (đang hoạt động) -> highlight rồi gọi callback cho caller xử lý
  const handleSelectStation = (station: Station) => {
    setSelectedStationId(station.id);
    onStationSelect(station);
  };

  const provinceItems = provinces.map((p) => ({
    id: p.id,
    label: p.provinceName,
  }));
  const communeItems = communes.map((c) => ({
    id: c.id,
    label: c.communeName,
  }));

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <ListColumn
        title="Province / City"
        items={provinceItems}
        selectedId={selectedProvinceId}
        onSelect={handleSelectProvince}
        isLoading={isLoadingProvinces}
        isDisabled={false}
        emptyMessage={provinceError ?? "No province data available."}
        disabledMessage=""
      />

      <ListColumn
        title="Commune"
        items={communeItems}
        selectedId={selectedCommuneId}
        onSelect={handleSelectCommune}
        isLoading={isLoadingCommunes}
        isDisabled={selectedProvinceId === null}
        emptyMessage={communeError ?? "No communes available."}
        disabledMessage="Select a province/city to view communes."
      />

      {/* Cột Station: dùng StationCard cho từng item */}
      <div
        className={`flex h-full flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest transition-opacity ${
          selectedCommuneId === null ? "opacity-50" : ""
        }`}
      >
        <div className="border-b border-outline-variant px-5 py-4">
          <span
            className={`text-label-md uppercase tracking-wide ${
              selectedCommuneId === null
                ? "text-outline-variant"
                : "text-on-surface-variant"
            }`}
          >
            Service Centers
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedCommuneId === null ? (
            <p className="px-5 py-6 text-body-md text-on-surface-variant">
              Select a commune to view service centers.
            </p>
          ) : isLoadingStations ? (
            <Loading rows={3} />
          ) : stations.length === 0 ? (
            <p className="px-5 py-6 text-body-md text-on-surface-variant">
              {stationError ??
                "Failed to load service centers. Please try again."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {stations.map((station) => (
                <li key={station.id}>
                  <StationCard
                    station={station}
                    isSelected={station.id === selectedStationId}
                    onSelect={handleSelectStation}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressSelector;

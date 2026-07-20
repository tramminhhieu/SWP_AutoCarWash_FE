import type { Station } from "../types/station";

interface StationCardProps {
  station: Station;
  isSelected: boolean;
  onSelect: (station: Station) => void;
}

// Hiển thị 1 chi nhánh (station). Dùng trong StationList và trong
// AddressSelector (bước chọn station ở flow booking).
// operating = false => mờ cả card, không click được, badge đổi thành CLOSED.
const StationCard = ({ station, isSelected, onSelect }: StationCardProps) => {
  const isCardDisabled = !station.operating;

  return (
    <button
      type="button"
      disabled={isCardDisabled}
      onClick={() => onSelect(station)}
      className={`w-full rounded-xl border p-4 text-left shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)] transition-all
        ${
          isCardDisabled
            ? "cursor-not-allowed border-outline-variant bg-surface-container-lowest opacity-40"
            : isSelected
              ? "border-2 border-primary bg-primary-container/7"
              : "border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:shadow-[0_10px_25px_-5px_rgba(29,78,216,0.12)]"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-body-lg font-semibold text-on-surface">
          {station.stationName}
        </span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-label-md font-bold
            ${
              station.operating
                ? "bg-tertiary-fixed/30 text-tertiary-fixed-dim"
                : "bg-surface-container-high text-on-surface-variant"
            }`}
        >
          {station.operating ? "OPEN" : "CLOSED"}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-body-md text-on-surface-variant">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M12 22s7-7.58 7-12.5A7 7 0 005 9.5C5 14.42 12 22 12 22z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="9.5"
            r="2.5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span>{station.address}</span>
      </div>
    </button>
  );
};

export default StationCard;

import { useState } from "react";
import AddressSelector from "../../station/components/AddressSelector";
import WashLaneList from "../components/WashLaneList";
import type { Station } from "../../station/types/station";
import { Plus } from "lucide-react";
import WashLaneCreateModal from "../components/WashLaneCreateModal";

const WashLaneManagement = () => {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-container-max px-4 md:px-12 py-20">
      <div className="mb-6">
        <h1 className="font-headline text-headline-lg text-on-surface">
          Wash Lane Management
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Select a station to view and manage its wash lanes.
        </p>
      </div>

      <AddressSelector
        onStationSelect={(station) => setSelectedStation(station)}
      />

      {selectedStation ? (
        <>
          {/* Table header + Add New button */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-headline-md font-semibold text-on-surface">
              Lanes — {selectedStation.stationName}
            </h2>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <Plus size={18} />
              Add New
            </button>
          </div>

          <WashLaneList
            stationId={selectedStation.id}
            refreshKey={refreshKey}
          />
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-outline-variant bg-surface-container-lowest p-10 text-center">
          <p className="text-body-md text-on-surface-variant">
            Please select a station to view its wash lanes.
          </p>
        </div>
      )}

      {/* Create lane modal */}
      {isModalOpen && selectedStation && (
        <WashLaneCreateModal
          stationId={selectedStation.id}
          stationName={selectedStation.stationName}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
};

export default WashLaneManagement;

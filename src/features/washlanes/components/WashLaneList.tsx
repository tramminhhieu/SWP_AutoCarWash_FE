import { useEffect, useState } from "react";
import { getWashLanesByStation, deleteLane } from "../api/washlaneApi";
import type { WashLane, LaneStatus } from "../types/washlane";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import Modal from "../../../components/ui/Modal";

// Map errorCode from BE → user-facing error message
const DELETE_ERROR_MAP: Record<string, string> = {
  CANNOT_DELETE_WASHING_LANE:
    "Cannot delete a lane with WASHING status. Please wait for the technician to complete the current order.",
  LANE_NOT_FOUND: "Lane not found or has already been deleted.",
};

interface WashLaneListProps {
  stationId: number;
  refreshKey?: number;
}

// Map status → badge style (HydroLux design tokens)
const STATUS_BADGE: Record<LaneStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Available",
    className: "bg-tertiary-fixed/30 text-tertiary-fixed-dim",
  },
  WASHING: {
    label: "Washing",
    className: "bg-secondary-container/30 text-secondary",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className: "bg-surface-container-high text-on-surface-variant",
  },
};

// Displays the list of wash lanes for a station.
// Triggered as soon as Admin selects a station from the cascading filter.
const WashLaneList = ({ stationId, refreshKey }: WashLaneListProps) => {
  const [lanes, setLanes] = useState<WashLane[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [laneToDelete, setLaneToDelete] = useState<WashLane | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLanes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWashLanesByStation(stationId);
      setLanes(data);
    } catch (err) {
      const apiError = getApiErrorInfo(err);
      setError(apiError.message || "Failed to load wash lanes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadLanes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getWashLanesByStation(stationId);
        setLanes(data);
      } catch (err) {
        const apiError = getApiErrorInfo(err);
        setError(apiError.message || "Failed to load wash lanes.");
      } finally {
        setIsLoading(false);
      }
    };
    loadLanes();
  }, [stationId, refreshKey]);

  const handleDeleteClick = (lane: WashLane) => {
    setLaneToDelete(lane);
  };

  // Confirm delete — call API then refresh table
  const handleConfirmDelete = async () => {
    if (!laneToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLane(laneToDelete.id);
      setSuccessMessage(
        `Lane "${laneToDelete.laneName}" has been deleted successfully.`,
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      setLaneToDelete(null);
      fetchLanes();
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setToastMessage(
        DELETE_ERROR_MAP[errorCode ?? ""] ??
          message ??
          "Failed to delete lane. Please try again.",
      );
      setTimeout(() => setToastMessage(null), 1000);
      setLaneToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-2xl bg-surface-container-high/40"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
        <p className="text-body-md text-error">{error}</p>
      </div>
    );
  }

  if (lanes.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
        <p className="text-body-md text-on-surface-variant">
          This station has no wash lanes yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        variant="success"
        title="Success"
        message={successMessage}
      />

      <Modal
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
        variant="danger"
        title="Unable to Delete"
        message={toastMessage ?? ""}
        confirmText="Got it"
        onConfirm={() => setToastMessage(null)}
      />

      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-ice">
              <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant">
                Lane Name
              </th>
              <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant">
                Status
              </th>
              <th className="px-5 py-3 text-right text-label-md font-semibold text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {lanes.map((lane) => {
              const badge = STATUS_BADGE[lane.status];
              const isWashing = lane.status === "WASHING";

              return (
                <tr
                  key={lane.id}
                  className="border-b border-outline-variant/50 last:border-b-0"
                >
                  <td className="px-5 py-4 text-body-md font-semibold text-on-surface">
                    {lane.laneName}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-label-md font-bold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!isWashing && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(lane)}
                        className="rounded-lg bg-error/10 px-4 py-2 text-label-md font-semibold text-error transition-all hover:bg-error/20"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {laneToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.12)]">
            <h3 className="font-headline text-headline-md text-on-surface">
              Confirm Deletion
            </h3>
            <p className="mt-3 text-body-md text-on-surface-variant">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-on-surface">
                "{laneToDelete.laneName}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLaneToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-outline-variant px-5 py-2.5 text-body-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-lg bg-error px-5 py-2.5 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WashLaneList;

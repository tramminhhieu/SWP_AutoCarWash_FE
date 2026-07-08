import { useEffect, useState } from "react";
import { getWashLanesByStation, deleteLane } from "../api/washlaneApi";
import type { WashLane, LaneStatus } from "../types/washlane";
import { getApiErrorInfo } from "../../../lib/axiosClient";

// Map errorCode BE → message tiếng Việt
const DELETE_ERROR_MAP: Record<string, string> = {
  CANNOT_DELETE_WASHING_LANE:
    "Không thể xóa làn rửa xe đang có trạng thái ĐANG RỬA (WASHING). Vui lòng đợi kỹ thuật viên hoàn thành đơn hàng hiện tại.",
  LANE_NOT_FOUND: "Làn rửa không tồn tại hoặc đã bị xóa.",
};

interface WashLaneListProps {
  stationId: number;
  refreshKey?: number;
}

// Map trạng thái → style badge (theo design token HydroLux)
const STATUS_BADGE: Record<LaneStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Sẵn sàng",
    className: "bg-tertiary-fixed/30 text-tertiary-fixed-dim",
  },
  WASHING: {
    label: "Đang rửa",
    className: "bg-secondary-container/30 text-secondary",
  },
  MAINTENANCE: {
    label: "Bảo trì",
    className: "bg-surface-container-high text-on-surface-variant",
  },
};

// Hiển thị danh sách làn rửa của 1 station.
// Kích hoạt ngay khi Admin chọn xong station từ bộ lọc phân cấp.
const WashLaneList = ({ stationId, refreshKey }: WashLaneListProps) => {
  const [lanes, setLanes] = useState<WashLane[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Toast thành công sau khi xóa
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // AC02: Popup xác nhận xóa — lưu lane đang chờ xác nhận
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
      setError(apiError.message || "Không thể tải danh sách làn rửa.");
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
        setError(apiError.message || "Không thể tải danh sách làn rửa.");
      } finally {
        setIsLoading(false);
      }
    };
    loadLanes();
  }, [stationId, refreshKey]);

  // AC01: Xử lý bấm nút Xóa theo trạng thái làn
  const handleDeleteClick = (lane: WashLane) => {
    if (lane.status === "WASHING") {
      setToastMessage(
        "Không thể xóa làn rửa xe đang có trạng thái ĐANG RỬA (WASHING). Vui lòng đợi kỹ thuật viên hoàn thành đơn hàng hiện tại.",
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    // AC02: Mở popup xác nhận
    setLaneToDelete(lane);
  };

  // Xác nhận xóa — gọi API delete rồi refresh bảng
  const handleConfirmDelete = async () => {
    if (!laneToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLane(laneToDelete.id);
      setSuccessMessage(`Đã xóa làn "${laneToDelete.laneName}" thành công.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setLaneToDelete(null);
      // Refresh bảng
      fetchLanes();
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setToastMessage(
        DELETE_ERROR_MAP[errorCode ?? ""] ??
          message ??
          "Xóa làn thất bại. Vui lòng thử lại.",
      );
      setTimeout(() => setToastMessage(null), 4000);
      setLaneToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Loading state ---
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

  // --- Error state ---
  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
        <p className="text-body-md text-error">{error}</p>
      </div>
    );
  }

  // --- Empty state ---
  if (lanes.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
        <p className="text-body-md text-on-surface-variant">
          Trạm này chưa có làn rửa nào.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Toast thành công */}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-tertiary/20 bg-tertiary-fixed/15 px-4 py-3 text-body-md font-medium text-tertiary-fixed-dim">
          {successMessage}
        </div>
      )}

      {/* Toast thông báo lỗi AC01 */}
      {toastMessage && (
        <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-body-md text-error">
          {toastMessage}
        </div>
      )}

      {/* AC00: Bảng danh sách làn */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-ice">
              <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant">
                Tên làn
              </th>
              <th className="px-5 py-3 text-label-md font-semibold text-on-surface-variant">
                Trạng thái
              </th>
              <th className="px-5 py-3 text-right text-label-md font-semibold text-on-surface-variant">
                Thao tác
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
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(lane)}
                      className={`rounded-lg px-4 py-2 text-label-md font-semibold transition-all
                        ${
                          isWashing
                            ? "cursor-not-allowed bg-surface-container-high/50 text-on-surface-variant/40"
                            : "bg-error/10 text-error hover:bg-error/20"
                        }`}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AC02: Popup xác nhận xóa */}
      {laneToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_-5px_rgba(29,78,216,0.12)]">
            <h3 className="font-headline text-headline-md text-on-surface">
              Xác nhận xóa
            </h3>
            <p className="mt-3 text-body-md text-on-surface-variant">
              Bạn có chắc muốn xóa làn{" "}
              <span className="font-semibold text-on-surface">
                "{laneToDelete.laneName}"
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLaneToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-outline-variant px-5 py-2.5 text-body-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-lg bg-error px-5 py-2.5 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WashLaneList;

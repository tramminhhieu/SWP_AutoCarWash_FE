// Trạng thái làn rửa — dùng cho badge + logic nút Xóa
export type LaneStatus = "AVAILABLE" | "WASHING" | "MAINTENANCE";

// Khớp với response API PI-39-02: GET ACTIVE LANES BY STATION
export interface WashLane {
  id: number;
  laneName: string;
  status: LaneStatus;
  bookingWalkinRatio: number;
}

// Request body cho API-39-01: CREATE WASH LANE
export interface CreateLaneRequest {
  stationId: number;
  laneName: string;
  status: "AVAILABLE" | "MAINTENANCE";
  bookingWalkinRatio: number;
}

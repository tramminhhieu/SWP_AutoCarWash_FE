import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type { WashLane, CreateLaneRequest } from "../types/washlane";

export const getWashLanesByStation = async (
  stationId: number,
): Promise<WashLane[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<WashLane[]>>(
    API.WASHLANE.LIST_BY_STATION(stationId),
  );
  return res.data.data;
};

// API-39-01: CREATE WASH LANE FOR STATION
export const createLane = async (
  payload: CreateLaneRequest,
): Promise<WashLane> => {
  const res = await axiosClient.post<ApiSuccessResponse<WashLane>>(
    "/api/admin/stations/lanes",
    payload,
  );
  return res.data.data;
};

// API-39-02: DELETE WASH LANE (soft delete)
export const deleteLane = async (laneId: number): Promise<void> => {
  await axiosClient.delete(`/api/admin/stations/lanes/${laneId}`);
};

import axiosClient from "../../../lib/axiosClient";
import type { AddVehicleRequest, AddVehicleResponse } from "../types/vehicle";

// API-04-01: POST /api/vehicles - thêm xe mới cho customer hiện tại
// axiosClient đã tự gắn Authorization header + tự refresh token khi 401 (xem lib/axiosClient.ts)
export const addVehicle = async (
  data: AddVehicleRequest,
): Promise<AddVehicleResponse> => {
  const response = await axiosClient.post<AddVehicleResponse>(
    "/api/vehicles",
    data,
  );
  return response.data;
};

import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type {
  AddVehicleRequest,
  AddVehicleResponse,
  UpdateVehicleRequest,
  UpdateVehicleResponse,
} from "../types/vehicle";

// API-04-01: POST /api/vehicles - thêm xe mới cho customer hiện tại
// axiosClient đã tự gắn Authorization header + tự refresh token khi 401 (xem lib/axiosClient.ts)
export const addVehicle = async (
  data: AddVehicleRequest,
): Promise<AddVehicleResponse> => {
  const response = await axiosClient.post<AddVehicleResponse>(
    API.VEHICLE.ADD,
    data,
  );
  return response.data;
};

// API-04-02: PUT /api/vehicles/{vehicleId} - cập nhật thông tin xe
export const updateVehicle = async (
  vehicleId: number,
  data: UpdateVehicleRequest,
): Promise<UpdateVehicleResponse> => {
  const res = await axiosClient.put(API.VEHICLE.UPDATE(vehicleId), data);
  return res.data;
};

export const deleteVehicle = async (vehicleId: number): Promise<void> => {
  await axiosClient.delete(API.VEHICLE.DELETE(vehicleId));
};

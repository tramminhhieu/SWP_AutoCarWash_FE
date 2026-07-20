// Thông tin 1 xe của khách hàng - khớp các field cần thiết từ bảng `vehicle` (DB.txt)
export interface Vehicle {
  id: number;
  userId: number;
  licensePlate: string;
  brandName: string;
  color: string | null;
}

// Request thêm xe mới - khớp API-04-01: POST /api/vehicles
export interface AddVehicleRequest {
  licensePlate: string;
  brandName: string;
  color: string;
}

// Response thành công của API-04-01
export interface AddVehicleResponse {
  success: true;
  message: string;
}

// Request cập nhật xe - khớp API-04-02: PUT /api/vehicles/{vehicleId}
export interface UpdateVehicleRequest {
  licensePlate: string;
  brandName: string;
  color: string | null; // nullable per API-04-02
}

// Response thành công của API-04-02
export interface UpdateVehicleResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    licensePlate: string;
    brandName: string;
    color: string | null;
  };
}

// Mã lỗi nghiệp vụ BE trả về khi biển số đã tồn tại (API-04-01/02 - RESPONSE: ERROR)
export const LICENSE_PLATE_ALREADY_EXISTS = "LICENSE_PLATE_ALREADY_EXISTS";

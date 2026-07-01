// Thông tin 1 xe của khách hàng - khớp các field cần thiết từ bảng `vehicle` (DB.txt)
export interface Vehicle {
  id: number;
  customerId: number;
  licensePlate: string;
  brandName: string;
  color: string | null;
}

// Request thêm xe mới - khớp API-04-01: POST /api/vehicles
export interface AddVehicleRequest {
  customerId: number;
  licensePlate: string;
  brandName: string;
  color: string;
}

// Response thành công của API-04-01
export interface AddVehicleResponse {
  success: true;
  message: string;
}

// Mã lỗi nghiệp vụ BE trả về khi biển số đã tồn tại (API-04-01 - RESPONSE: ERROR)
export const LICENSE_PLATE_ALREADY_EXISTS = "LICENSE_PLATE_ALREADY_EXISTS";

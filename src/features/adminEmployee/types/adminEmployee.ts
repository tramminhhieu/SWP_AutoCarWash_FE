// Mirrors backend `staff/dto/response/EmployeeListItemResponse.java` +
// `EmployeeSummaryResponse.java` + `EmployeeListPageResponse.java`, returned by
// GET /api/employees (admin only).
export interface AdminEmployeeRow {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  stationId: number;
  stationName: string;
  active: boolean;
  createdAt: string; // "yyyy-MM-dd'T'HH:mm:ss"
}

export interface EmployeeKpiSummary {
  totalEmployees: number;
  newThisMonth: number;
}

// Mirrors backend `staff/dto/response/EmployeeDetailResponse.java`, returned by
// GET /api/employees/{employeeId} (admin only).
export interface AdminEmployeeDetail {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  // Tách riêng để form Edit seed được 2 ô input - BE lưu first/last name riêng.
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stationId: number;
  stationName: string;
  accountStatus: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

// Mirrors backend `staff/dto/request/UpdateEmployeeRequest.java`, body của
// PUT /api/employees/{employeeId}.
export interface UpdateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stationId: number;
  active: boolean;
}

// Mirrors backend `staff/dto/request/CreateEmployeeRequest.java`, body của
// POST /api/employees. Giống UpdateEmployeePayload nhưng thêm password: tạo nhân
// viên là tạo cả tài khoản đăng nhập, admin tự đặt mật khẩu rồi báo lại cho họ.
export interface CreateEmployeePayload extends UpdateEmployeePayload {
  password: string;
}

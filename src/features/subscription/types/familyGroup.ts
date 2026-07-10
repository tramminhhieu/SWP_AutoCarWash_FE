// Family Group member management - KHÔNG có trong Note.md (chưa có AC/API chính thức).
// Nora gửi prototype mockup ("Car Wash Prototype (1).zip" - các màn "Membership Management",
// "Member Details") và yêu cầu build theo mẫu đó với chức năng thêm/xóa/sửa thành viên.
// Data model tự dựng dựa trên bảng family_group / family_member thật trong data.sql
// (family_group: id, group_name, owner_customer_id, created_at, is_deleted;
//  family_member: id, family_group_id, customer_id, vehicle_id, vehicle_change_count,
//  vehicle_change_window_start), khớp với cùng cơ chế giới hạn đổi xe FE-59 (Profile.tsx)
// đã dùng cho Unlimited (transferUnlockDate) - áp dụng tương tự cho "Update Vehicle" ở đây.
export interface FamilyMember {
  id: number;
  name: string;
  phone: string;
  email: string;
  isOwner: boolean;
  addedAt: string; // "YYYY-MM-DD"
  vehicle: { licensePlate: string; vehicleName: string } | null;
  // Khoá nút "Update Vehicle" tạm thời sau lần đổi gần nhất - phản ánh đúng
  // vehicle_change_window_start trong data.sql (giống cơ chế transferUnlockDate ở FE-59).
  vehicleChangeLockedUntil: string | null; // ISO datetime, null = không bị khoá
}

export interface FamilyGroupDetail {
  // = id của UnlimitedSubscription (planType FAMILY) tương ứng - dùng chung 1 khoá để
  // không phải mock thêm 1 id gói gia đình riêng.
  subscriptionId: number;
  groupName: string;
  planName: string;
  // Slot cap ĐÃ áp effectiveCap() = min(5, subscription_plan.max_vehicle_count) trước khi
  // trả về từ familyGroupApi.ts - "5" là trần cứng của Family Group nói chung (BL-AC-23),
  // max_vehicle_count là trần riêng của từng plan (3-5 tuỳ tier/kỳ hạn thật trong data.sql).
  maxVehicleCount: number;
  members: FamilyMember[];
}

// BL-AC-19: thành viên thêm vào PHẢI là customer có sẵn trong hệ thống - không còn nhận
// name/phone tự nhập nữa, chỉ nhận email để tra cứu (giống 1 lời mời), tên/sđt lấy từ tài
// khoản tìm được. Xem MOCK_CUSTOMER_DIRECTORY trong familyGroupApi.ts.
export interface AddFamilyMemberRequest {
  email: string;
  licensePlate?: string;
  vehicleName?: string;
}

export interface UpdateMemberVehicleRequest {
  licensePlate: string;
  vehicleName: string;
}

export const FAMILY_GROUP_ERROR_CODES = {
  GROUP_NOT_FOUND: "GROUP_NOT_FOUND",
  GROUP_FULL: "GROUP_FULL",
  MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND",
  CANNOT_REMOVE_OWNER: "CANNOT_REMOVE_OWNER",
  DUPLICATE_EMAIL: "DUPLICATE_EMAIL",
  VEHICLE_CHANGE_LOCKED: "VEHICLE_CHANGE_LOCKED",
  // BL-AC-19: email không ứng với customer nào đã đăng ký trong hệ thống
  MEMBER_NOT_REGISTERED: "MEMBER_NOT_REGISTERED",
  // BL-AC-19: customer tìm được đã thuộc 1 Family Group khác (hoặc chính group này) rồi
  ALREADY_IN_A_GROUP: "ALREADY_IN_A_GROUP",
} as const;

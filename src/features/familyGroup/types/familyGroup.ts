// API-17-01: POST /api/family-groups/create
export interface CreateFamilyGroupRequest {
  groupName: string;
  vehicleId: number;
}

export interface CreateFamilyGroupResponse {
  familyGroupId: number;
  groupName: string;
  ownerCustomerId: number;
}

export type FamilyRoleInGroup = "OWNER" | "MEMBER";

export interface LinkedVehicleDto {
  vehicleId: number;
  licensePlate: string;
  brandName: string;
  color: string;
}

export interface GroupMemberDto {
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  roleInGroup: FamilyRoleInGroup;
  linkedVehicle: LinkedVehicleDto | null;
}

export interface GroupSubscriptionDto {
  planName: string;
  // Chuỗi tự do từ BE (subscription.getStatus()), không phải enum đóng - không ép kiểu union.
  status: string;
  endDate: string; // "YYYY-MM-DD"
  usageSummary: string; // vd "3/5"
}

// GET /api/family-groups/my-group - data là null (không phải lỗi) khi customer chưa có group.
export interface FamilyGroupDetails {
  familyGroupId: number;
  groupName: string;
  createdAt: string; // ISO datetime
  // BE field Java là "isOwner" (boolean) nhưng Jackson serialize theo JavaBean convention tự
  // cắt tiền tố "is" khỏi boolean getter -> JSON key thật là "owner", không phải "isOwner".
  // Đã verify trực tiếp qua response thật từ BE (không phải suy đoán từ tài liệu API).
  owner: boolean;
  subscription: GroupSubscriptionDto | null;
  members: GroupMemberDto[];
}

// Shape của mỗi phần tử trong ApiErrorResponse.errors[] khi create-group validate fail -
// cùng pattern với RegisterFieldError (src/features/auth/types/auth.ts), BE có thể trả về
// NHIỀU lỗi cùng lúc (vd vừa trống groupName vừa đã có group khác).
export interface FamilyGroupFieldError {
  field: "groupName" | "vehicleId" | "customerId" | string;
  errorCode: string;
  message: string;
}

// API-17-02: GET /api/family-groups/search-member?identifier= - tra cứu customer để mời vào
// nhóm bằng SĐT/email chính xác (không cho liệt kê toàn bộ khách hàng - AC01).
export interface SearchVehicleOption {
  id: number;
  licensePlate: string;
  brandName: string;
  color: string;
}

export interface SearchInvitedCustomerResponse {
  customerId: number;
  fullName: string;
  phone: string;
  email: string;
  // Chỉ gồm xe CHƯA bị xóa thuộc sở hữu của người được mời (AC03) - đổ thẳng vào Dropdown chọn xe.
  vehicles: SearchVehicleOption[];
}

// API-17-02: POST /api/family-groups/add-member
export interface AddFamilyMemberRequest {
  familyGroupId: number;
  invitedCustomerId: number;
  vehicleId: number;
}

// API-17-02 (Remove Member): DELETE /api/family-groups/members/{memberCustomerId}
export interface RemoveMemberResponse {
  familyGroupId: number;
  removedCustomerId: number;
  newUsageSummary: string; // vd "2/5"
}

// API-17-03: DELETE /api/family-groups/dissolve - owner xóa cứng cả nhóm (family_member hard
// delete, family_group soft delete, hủy subscription liên kết). Luôn có data, không có case null.
export interface DissolveGroupResponse {
  familyGroupId: number;
  ownerCustomerId: number;
  totalMembersKicked: number;
  subscriptionStatus: string;
}

// Mirror pattern SUBSCRIPTION_ERROR_CODES (src/features/subscription/types/subscription.ts)
export const FAMILY_GROUP_ERROR_CODES = {
  GROUP_NAME_CANNOT_BE_EMPTY: "FAMILY_SB__001",
  GROUP_NAME_TOO_LONG: "FAMILY_SB__002",
  VEHICLE_REQUIRED: "FAMILY_SB__003",
  CUSTOMER_ALREADY_HAS_FAMILY_GROUP: "FAMILY_SB__004",
  VEHICLE_ALREADY_IN_ANOTHER_GROUP: "FAMILY_SB__005",
  // BE dùng trùng "FAMILY_SB__006" cho cả FAMILY_GROUP_NOT_FOUND lẫn FORBIDDEN_NOT_GROUP_OWNER
  // (bug bên BE, xem ErrorCode.java) - với FE cả 2 đều là "không thể thao tác trên nhóm này",
  // gộp chung 1 xử lý (banner cấp trang, không gắn được vào field cụ thể).
  FAMILY_GROUP_ACCESS_ERROR: "FAMILY_SB__006",
  FAMILY_SUBSCRIPTION_EXPIRED_OR_NOT_FOUND: "FAMILY_SB__007",
  FAMILY_GROUP_LIMIT_EXCEEDED: "FAMILY_SB__008",
  CANNOT_INVITE_YOURSELF: "FAMILY_SB__009",
  INVITED_CUSTOMER_NOT_FOUND: "FAMILY_SB__010",
  INVITED_CUSTOMER_ALREADY_IN_ANOTHER_GROUP: "FAMILY_SB__011",
  VEHICLE_HAS_ACTIVE_PERSONAL_SUBSCRIPTION: "FAMILY_SB__012",
  IDENTIFIER_CANNOT_BE_EMPTY: "FAMILY_SB__013",
  CUSTOMER_NOT_FOUND: "CUSTOMER_002",
  // BE dùng chung "VEHICLE_002" cho cả VEHICLE_NOT_FOUND lẫn VEHICLE_NOT_BELONG_TO_CUSTOMER -
  // với form này cả 2 đều là "xe không hợp lệ", gộp chung 1 xử lý.
  VEHICLE_INVALID: "VEHICLE_002",
  // API-17-02 (Remove Member) - đã verify trực tiếp trong ErrorCode.java, khác với tài liệu
  // API gửi (tài liệu ghi "VEHICLE_HAS_ACTIVE_BOOKING" nhưng code thật trả "VEHICLE_005").
  UNAUTHORIZED_ACTION: "UNAUTHORIZED_ACTION",
  MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND",
  VEHICLE_HAS_ACTIVE_BOOKING: "VEHICLE_005",
  // Owner tự xóa chính mình qua API remove-member (phải dùng luồng dissolve group riêng).
  INVALID_ACTION: "INVALID_ACTION",
  // API-17-03 (Dissolve Group) - đã verify trực tiếp trong ErrorCode.java. Lưu ý: tài liệu API
  // ghi có case riêng FAMILY_GROUP_NOT_FOUND (444) khi owner chưa từng tạo group, nhưng code
  // thật dùng CHUNG UNAUTHORIZED_ACTION cho cả "không phải owner" lẫn "chưa có group" - không có
  // path FAMILY_GROUP_NOT_FOUND riêng trong dissolveFamilyGroup().
  GROUP_HAS_ACTIVE_BOOKINGS: "GROUP_HAS_ACTIVE_BOOKINGS",
} as const;

import type {
  AddFamilyMemberRequest,
  FamilyGroupDetail,
  FamilyMember,
  UpdateMemberVehicleRequest,
} from "../types/familyGroup";
import { FAMILY_GROUP_ERROR_CODES } from "../types/familyGroup";

// ⚠️ MOCK DATA - tính năng Family Group Management không có trong Note.md (không có
// AC/API chính thức), dựng theo yêu cầu của Nora + mockup "Car Wash Prototype (1).zip"
// (màn "Membership Management" / "Member Details"). Khi có API thật, thay các hàm dưới
// bằng axiosClient theo đúng signature hiện tại (không cần sửa page).

// BL-AC-19: thành viên thêm vào Family Group phải là customer CÓ SẴN trong hệ thống, chưa
// thuộc group nào khác. Mock 1 "danh bạ" nhỏ mô phỏng các customer đã có tài khoản (rút tên
// từ mockup Nora gửi) để demo validation - addMember() tra email trong danh bạ này thay vì
// nhận name/phone tự nhập tự do.
const MOCK_CUSTOMER_DIRECTORY: { name: string; phone: string; email: string }[] = [
  { name: "Emma Watson", phone: "555-0987", email: "emma.w@example.com" },
  { name: "Michael Chang", phone: "555-0456", email: "michael.c@example.com" },
  { name: "Sarah Connor", phone: "555-0321", email: "sarah.c@example.com" },
  // David chưa ở group nào - dùng để demo case Add Member THÀNH CÔNG.
  { name: "David Kim", phone: "555-0765", email: "david.k@example.com" },
  // Đã ở group #9 rồi (dưới) - dùng để demo case ALREADY_IN_A_GROUP khi thử add lại.
];

// BL-AC-23: 1 Family Group tối đa 5 thành viên bất kể plan đang dùng cho phép bao nhiêu xe -
// áp dụng khi ĐỌC group, không lưu cứng vào seed, để đúng ngay cả khi sau này có plan mới
// cho phép > 5 xe (hiện tại data.sql thật max là 5 nên chưa có plan nào vượt trần này).
const FAMILY_GROUP_HARD_CAP = 5;
function effectiveCap(rawMaxVehicleCount: number): number {
  return Math.min(FAMILY_GROUP_HARD_CAP, rawMaxVehicleCount);
}

let mockGroups: Record<number, FamilyGroupDetail> = {
  // key = subscriptionId của gói FAMILY tương ứng (mockSubscriptions id 9 trong
  // subscriptionApi.ts - "Family Premium 3 Months"). maxVehicleCount ở đây là giá trị THÔ
  // lấy từ plan (4) - effectiveCap() áp dụng lúc đọc, không lúc lưu.
  9: {
    subscriptionId: 9,
    groupName: "My Family Group",
    planName: "Family Premium 3 Months",
    maxVehicleCount: 4,
    members: [
      {
        id: 1,
        name: "You",
        phone: "555-0123",
        email: "you@example.com",
        isOwner: true,
        addedAt: "2026-06-20",
        vehicle: { licensePlate: "65C-11111", vehicleName: "Mazda CX-5" },
        vehicleChangeLockedUntil: null,
      },
      {
        id: 2,
        name: "Emma Watson",
        phone: "555-0987",
        email: "emma.w@example.com",
        isOwner: false,
        addedAt: "2026-06-22",
        vehicle: { licensePlate: "65D-22222", vehicleName: "Honda City" },
        vehicleChangeLockedUntil: null,
      },
      {
        id: 3,
        name: "Michael Chang",
        phone: "555-0456",
        email: "michael.c@example.com",
        isOwner: false,
        addedAt: "2026-06-25",
        // Demo trạng thái khoá đổi xe tạm thời (giống cơ chế transferUnlockDate ở FE-59) -
        // nút "Update Vehicle" sẽ bị disable đến hết ngày này.
        vehicle: { licensePlate: "65E-33333", vehicleName: "Kia Seltos" },
        vehicleChangeLockedUntil: "2026-07-15T00:00:00.000Z",
      },
    ],
  },
};

let nextMemberId = 100;

const delay = <T,>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const rejectWith = (message: string, errorCode: string) =>
  Promise.reject({ response: { data: { success: false, message, errorCode } } });

const cloneMembers = (members: FamilyMember[]): FamilyMember[] =>
  members.map((m) => ({ ...m }));

export const getFamilyGroup = (subscriptionId: number): Promise<FamilyGroupDetail> => {
  const group = mockGroups[subscriptionId];
  if (!group) {
    return rejectWith("Family group not found.", FAMILY_GROUP_ERROR_CODES.GROUP_NOT_FOUND);
  }
  return delay({
    ...group,
    maxVehicleCount: effectiveCap(group.maxVehicleCount),
    members: cloneMembers(group.members),
  });
};

// BL-AC-19: member phải tồn tại trong hệ thống (tra trong MOCK_CUSTOMER_DIRECTORY) và chưa
// thuộc bất kỳ Family Group nào khác (kể cả group hiện tại).
export const addMember = (
  subscriptionId: number,
  data: AddFamilyMemberRequest,
): Promise<FamilyMember> => {
  const group = mockGroups[subscriptionId];
  if (!group) {
    return rejectWith("Family group not found.", FAMILY_GROUP_ERROR_CODES.GROUP_NOT_FOUND);
  }
  if (group.members.length >= effectiveCap(group.maxVehicleCount)) {
    return rejectWith(
      "This family group has reached its member limit.",
      FAMILY_GROUP_ERROR_CODES.GROUP_FULL,
    );
  }

  const email = data.email.trim().toLowerCase();
  const account = MOCK_CUSTOMER_DIRECTORY.find((c) => c.email.toLowerCase() === email);
  if (!account) {
    return rejectWith(
      "No account found for this email. The person must have a registered account first.",
      FAMILY_GROUP_ERROR_CODES.MEMBER_NOT_REGISTERED,
    );
  }

  const isInAnyGroup = Object.values(mockGroups).some((g) =>
    g.members.some((m) => m.email.toLowerCase() === email),
  );
  if (isInAnyGroup) {
    return rejectWith(
      "This person already belongs to a family group.",
      FAMILY_GROUP_ERROR_CODES.ALREADY_IN_A_GROUP,
    );
  }

  const newMember: FamilyMember = {
    id: nextMemberId++,
    name: account.name,
    phone: account.phone,
    email: account.email,
    isOwner: false,
    addedAt: new Date().toISOString().slice(0, 10),
    vehicle:
      data.licensePlate && data.vehicleName
        ? { licensePlate: data.licensePlate, vehicleName: data.vehicleName }
        : null,
    vehicleChangeLockedUntil: null,
  };

  mockGroups = {
    ...mockGroups,
    [subscriptionId]: { ...group, members: [...group.members, newMember] },
  };
  return delay(newMember);
};

export const removeMember = (
  subscriptionId: number,
  memberId: number,
): Promise<{ success: true }> => {
  const group = mockGroups[subscriptionId];
  if (!group) {
    return rejectWith("Family group not found.", FAMILY_GROUP_ERROR_CODES.GROUP_NOT_FOUND);
  }
  const member = group.members.find((m) => m.id === memberId);
  if (!member) {
    return rejectWith("Member not found.", FAMILY_GROUP_ERROR_CODES.MEMBER_NOT_FOUND);
  }
  if (member.isOwner) {
    return rejectWith(
      "The group owner cannot be removed.",
      FAMILY_GROUP_ERROR_CODES.CANNOT_REMOVE_OWNER,
    );
  }

  mockGroups = {
    ...mockGroups,
    [subscriptionId]: {
      ...group,
      members: group.members.filter((m) => m.id !== memberId),
    },
  };
  return delay({ success: true });
};

export const updateMemberVehicle = (
  subscriptionId: number,
  memberId: number,
  data: UpdateMemberVehicleRequest,
): Promise<FamilyMember> => {
  const group = mockGroups[subscriptionId];
  if (!group) {
    return rejectWith("Family group not found.", FAMILY_GROUP_ERROR_CODES.GROUP_NOT_FOUND);
  }
  const member = group.members.find((m) => m.id === memberId);
  if (!member) {
    return rejectWith("Member not found.", FAMILY_GROUP_ERROR_CODES.MEMBER_NOT_FOUND);
  }
  if (member.vehicleChangeLockedUntil && new Date(member.vehicleChangeLockedUntil) > new Date()) {
    return rejectWith(
      "Vehicle changes for this member are temporarily locked.",
      FAMILY_GROUP_ERROR_CODES.VEHICLE_CHANGE_LOCKED,
    );
  }

  // Mỗi lần đổi xe mở khoá tiếp 30 ngày, giống cơ chế 30-ngày ở FE-59 (Profile.tsx).
  const lockUntil = new Date();
  lockUntil.setDate(lockUntil.getDate() + 30);

  const updatedMember: FamilyMember = {
    ...member,
    vehicle: { licensePlate: data.licensePlate, vehicleName: data.vehicleName },
    vehicleChangeLockedUntil: lockUntil.toISOString(),
  };

  mockGroups = {
    ...mockGroups,
    [subscriptionId]: {
      ...group,
      members: group.members.map((m) => (m.id === memberId ? updatedMember : m)),
    },
  };
  return delay(updatedMember);
};

// BL-AC-21: chỉ chủ nhóm mới được giải tán Family Group - toàn bộ liên kết thành viên bị
// huỷ. Không đụng đến chính Subscription (family_subscription) - gói vẫn ACTIVE/EXPIRED
// theo đúng ngày hết hạn của nó, giải tán nhóm chỉ dọn danh sách thành viên/xe liên kết.
export const dissolveGroup = (subscriptionId: number): Promise<{ success: true }> => {
  const group = mockGroups[subscriptionId];
  if (!group) {
    return rejectWith("Family group not found.", FAMILY_GROUP_ERROR_CODES.GROUP_NOT_FOUND);
  }

  const rest = { ...mockGroups };
  delete rest[subscriptionId];
  mockGroups = rest;
  return delay({ success: true });
};

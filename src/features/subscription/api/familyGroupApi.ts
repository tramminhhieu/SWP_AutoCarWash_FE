import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AddFamilyMemberRequest,
  FamilyGroupDetail,
  FamilyMember,
  UpdateMemberVehicleRequest,
} from "../types/familyGroup";

// ⚠️ API TẠM THỜI - Family Group Management không có trong Note.md/spec Sprint 3 (không có
// AC/API chính thức từ BE - xem BE_API_GAPS_Subscription.md mục Family Group). Path dưới đây
// tự đoán theo đúng pattern REST đang dùng cho Unlimited Subscription
// (API.CUSTOMER.FAMILY_GROUP.* trong src/constants/apiEndpoints.ts), CHƯA được BE xác nhận.
// Khi BE có API thật, đối chiếu lại path/method/response shape ở đây và ở apiEndpoints.ts.

// BL-AC-23: 1 Family Group tối đa 5 thành viên bất kể plan đang dùng cho phép bao nhiêu xe.
const FAMILY_GROUP_HARD_CAP = 5;
function effectiveCap(rawMaxVehicleCount: number): number {
  return Math.min(FAMILY_GROUP_HARD_CAP, rawMaxVehicleCount);
}

export const getFamilyGroup = async (
  subscriptionId: number,
): Promise<FamilyGroupDetail> => {
  const res = await axiosClient.get<ApiSuccessResponse<FamilyGroupDetail>>(
    API.CUSTOMER.FAMILY_GROUP.DETAIL(subscriptionId),
  );
  const group = res.data.data;
  return { ...group, maxVehicleCount: effectiveCap(group.maxVehicleCount) };
};

export const addMember = async (
  subscriptionId: number,
  data: AddFamilyMemberRequest,
): Promise<FamilyMember> => {
  const res = await axiosClient.post<ApiSuccessResponse<FamilyMember>>(
    API.CUSTOMER.FAMILY_GROUP.ADD_MEMBER(subscriptionId),
    data,
  );
  return res.data.data;
};

export const removeMember = async (
  subscriptionId: number,
  memberId: number,
): Promise<{ success: true }> => {
  await axiosClient.delete<ApiSuccessResponse<unknown>>(
    API.CUSTOMER.FAMILY_GROUP.REMOVE_MEMBER(subscriptionId, memberId),
  );
  return { success: true };
};

export const updateMemberVehicle = async (
  subscriptionId: number,
  memberId: number,
  data: UpdateMemberVehicleRequest,
): Promise<FamilyMember> => {
  const res = await axiosClient.patch<ApiSuccessResponse<FamilyMember>>(
    API.CUSTOMER.FAMILY_GROUP.UPDATE_MEMBER_VEHICLE(subscriptionId, memberId),
    data,
  );
  return res.data.data;
};

// BL-AC-21: chỉ chủ nhóm mới được giải tán Family Group.
export const dissolveGroup = async (
  subscriptionId: number,
): Promise<{ success: true }> => {
  await axiosClient.delete<ApiSuccessResponse<unknown>>(
    API.CUSTOMER.FAMILY_GROUP.DISSOLVE(subscriptionId),
  );
  return { success: true };
};

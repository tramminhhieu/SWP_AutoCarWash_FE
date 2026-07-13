import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AddFamilyMemberRequest,
  CreateFamilyGroupRequest,
  CreateFamilyGroupResponse,
  DissolveGroupResponse,
  FamilyGroupDetails,
  RemoveMemberResponse,
  SearchInvitedCustomerResponse,
} from "../types/familyGroup";

// API-17-01: POST /api/family-groups/create
export const createFamilyGroup = async (
  data: CreateFamilyGroupRequest,
): Promise<CreateFamilyGroupResponse> => {
  const res = await axiosClient.post<ApiSuccessResponse<CreateFamilyGroupResponse>>(
    API.FAMILY_GROUP.CREATE,
    data,
  );
  return res.data.data;
};

// AC08: GET /api/family-groups/my-group - tài liệu ghi data null khi chưa có group, nhưng BE
// thật (đã verify qua response thật) đôi khi KHÔNG trả field "data" luôn (chỉ có
// message/success) thay vì "data": null -> res.data.data sẽ là undefined chứ không phải null.
// Chuẩn hóa về null để component phía dưới chỉ cần so sánh "=== null" một kiểu duy nhất.
export const getMyFamilyGroup = async (): Promise<FamilyGroupDetails | null> => {
  const res = await axiosClient.get<ApiSuccessResponse<FamilyGroupDetails | null>>(
    API.FAMILY_GROUP.MY_GROUP,
  );
  return res.data.data ?? null;
};

// API-17-02 AC01/AC02/AC03: GET /api/family-groups/search-member?identifier=
export const searchInvitedCustomer = async (
  identifier: string,
): Promise<SearchInvitedCustomerResponse> => {
  const res = await axiosClient.get<ApiSuccessResponse<SearchInvitedCustomerResponse>>(
    API.FAMILY_GROUP.SEARCH_MEMBER,
    { params: { identifier } },
  );
  return res.data.data;
};

// API-17-02 AC09: POST /api/family-groups/add-member - response không có data (chỉ success/message).
export const addFamilyMember = async (data: AddFamilyMemberRequest): Promise<void> => {
  await axiosClient.post<ApiSuccessResponse<null>>(API.FAMILY_GROUP.ADD_MEMBER, data);
};

// API-17-02 (Remove Member) AC04: DELETE /api/family-groups/members/{memberCustomerId}
export const removeMember = async (
  memberCustomerId: number,
): Promise<RemoveMemberResponse> => {
  const res = await axiosClient.delete<ApiSuccessResponse<RemoveMemberResponse>>(
    API.FAMILY_GROUP.REMOVE_MEMBER(memberCustomerId),
  );
  return res.data.data;
};

// API-17-03 (Dissolve Group) AC03/AC04: DELETE /api/family-groups/dissolve - owner giải tán
// cả nhóm (hard delete toàn bộ thành viên, hủy subscription liên kết).
export const dissolveFamilyGroup = async (): Promise<DissolveGroupResponse> => {
  const res = await axiosClient.delete<ApiSuccessResponse<DissolveGroupResponse>>(
    API.FAMILY_GROUP.DISSOLVE,
  );
  return res.data.data;
};

import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  AddFamilyMemberRequest,
  CreateFamilyGroupRequest,
  CreateFamilyGroupResponse,
  FamilyGroupDetails,
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

// AC08: GET /api/family-groups/my-group - data null (không phải lỗi) khi chưa có group.
export const getMyFamilyGroup = async (): Promise<FamilyGroupDetails | null> => {
  const res = await axiosClient.get<ApiSuccessResponse<FamilyGroupDetails | null>>(
    API.FAMILY_GROUP.MY_GROUP,
  );
  return res.data.data;
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

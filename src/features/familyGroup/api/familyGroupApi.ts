import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type {
  CreateFamilyGroupRequest,
  CreateFamilyGroupResponse,
  FamilyGroupDetails,
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

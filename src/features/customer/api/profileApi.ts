// API cho Customer feature: profile, update profile, đổi mật khẩu
// Xem API.txt: API-05-01, API-05-02, API-05-03
import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type {
  ChangePasswordRequest,
  CustomerProfileResponse,
  TransferPlanRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "../types/profile";

// ─── GET /api/customers/profile (API-05-02) ───────────────────────────────────
export const getCustomerProfile =
  async (): Promise<CustomerProfileResponse> => {
    const res = await axiosClient.get(API.CUSTOMER.PROFILE);
    return { ...res.data, data: res.data.data.data };
  };

// ─── PUT /api/customers/profile (API-05-01) ───────────────────────────────────
export const updateCustomerProfile = async (
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> => {
  const res = await axiosClient.put(API.CUSTOMER.UPDATE_PROFILE, data);
  return res.data;
};

// ─── POST /api/auth/change-password (API-05-03) ───────────────────────────────
export const changePassword = async (
  data: ChangePasswordRequest,
): Promise<void> => {
  await axiosClient.patch(API.CUSTOMER.CHANGE_PASSWORD, data);
};

// ─── POST /api/subscriptions/transfer (API-06-01) ─────────────────────────────
export const transferSubscription = async (
  data: TransferPlanRequest,
): Promise<void> => {
  await axiosClient.post(API.CUSTOMER.TRANSFER_SUBSCRIPTION, data);
};

// API cho Customer feature: profile, update profile, đổi mật khẩu
// Xem API.txt: API-05-01, API-05-02, API-05-03
import { API } from "../../../constants/apiEndpoints";
import axiosClient from "../../../lib/axiosClient";
import type {
  ChangePasswordRequest,
  CustomerProfileResponse,
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

// FE-59-US-01: PATCH /api/customer/unlimited-subscriptions/{subscriptionId}/transfer-vehicle
// (thay cho path đoán trước đây "/api/subscriptions/transfer" - path/shape thật lấy từ
// UnlimitedSubscriptionController trên nhánh BE feature/53,60,55,56,58,59. Endpoint nhận
// subscriptionId trong path, không phải sourceVehicleId - xem handleConfirmTransfer trong
// Profile.tsx để biết cách tra subscriptionId từ vehicle nguồn qua getMySubscriptions()).
export const transferVehicle = async (
  subscriptionId: number,
  vehicleId: number,
): Promise<void> => {
  await axiosClient.patch(
    API.CUSTOMER.UNLIMITED_SUBSCRIPTION.TRANSFER_VEHICLE(subscriptionId),
    { vehicleId },
  );
};

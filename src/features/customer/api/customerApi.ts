// API cho Customer feature: profile, update profile, đổi mật khẩu
// Xem API.txt: API-05-01, API-05-02, API-05-03
import axiosClient from "../../../lib/axiosClient";
import type {
  CustomerProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
} from "../types/profile";

// ─── Bật/tắt mock tại đây — đổi thành false khi BE sẵn sàng ─────────────────
const USE_MOCK = true;

// ─── Mock data theo API-05-02 response shape ─────────────────────────────────
const MOCK_PROFILE: CustomerProfileResponse = {
  success: true,
  message: "Get profile successfully",
  data: {
    customer: {
      id: 12,
      firstName: "Tấn",
      lastName: "Phong",
      birthday: "1985-12-06",
      email: "m.sterling@aquawashpro.com",
      phone: "+1 (555) 234-8891",
    },
    tier: {
      currentTierName: "Gold",
      currentPoints: 2450,
      nextTierName: "Platinum",
      nextTierMinPoints: 3000,
      pointsToNextTier: 550,
    },
    vehicles: [
      {
        id: 1,
        licensePlate: "51F-88888",
        brandName: "Porsche 911 GT3",
        color: "Chalk Grey",
        activeSubscription: { type: "UNLIMITED" },
      },
      {
        id: 2,
        licensePlate: "51F-66666",
        brandName: "BMW M3 Comp",
        color: "Tanzanite Blue",
      },
    ],
  },
};

// Giả lập delay network (ms)
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ─── GET /api/customers/profile (API-05-02) ───────────────────────────────────
export const getCustomerProfile =
  async (): Promise<CustomerProfileResponse> => {
    if (USE_MOCK) {
      await delay();
      return MOCK_PROFILE;
    }
    const res = await axiosClient.get("/customers/profile");
    return res.data;
  };

// ─── PUT /api/customers/profile (API-05-01) ───────────────────────────────────
export const updateCustomerProfile = async (
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> => {
  if (USE_MOCK) {
    await delay(800);
    return {
      success: true,
      message: "Your information has been updated successfully.",
      data: { ...MOCK_PROFILE.data.customer, ...data },
    };
  }
  const res = await axiosClient.put("/customers/profile", data);
  return res.data;
};

// ─── POST /api/auth/change-password (API-05-03) ───────────────────────────────
export const changePassword = async (
  data: ChangePasswordRequest,
): Promise<void> => {
  if (USE_MOCK) {
    await delay(800);
    // Test case lỗi: bỏ comment dòng muốn test
    // Sai mật khẩu hiện tại (AC-04.2):
    // throw { response: { data: { errorCode: "COMMON_003", errors: [{ field: "currentPassword", errorCode: "INCORRECT_CURRENT_PASSWORD", message: "Current password is incorrect." }] } } };
    // New trùng Current (AC-04.5):
    // throw { response: { data: { errorCode: "COMMON_003", errors: [{ field: "newPassword", errorCode: "NEW_PASSWORD_SAME_AS_CURRENT", message: "New password must not be the same as your current password." }] } } };
    return;
  }
  await axiosClient.post("/auth/change-password", data);
};

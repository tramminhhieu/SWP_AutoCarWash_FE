import { FAMILY_GROUP_ERROR_CODES } from "../types/familyGroup";

// UI luôn tiếng Anh (kể cả khi BE trả message tiếng Việt) - dùng message riêng theo errorCode,
// cùng pattern applyServerFieldErrors ở Register.tsx (src/features/auth/pages/Register.tsx).
// Dùng chung cho cả Create Family Group (API-17-01) và Add Family Member (API-17-02) vì nhiều
// errorCode lặp lại giữa 2 luồng (CUSTOMER_NOT_FOUND, VEHICLE_INVALID, VEHICLE_ALREADY_IN_...).
const FAMILY_GROUP_ERROR_MESSAGES: Record<string, string> = {
  [FAMILY_GROUP_ERROR_CODES.GROUP_NAME_CANNOT_BE_EMPTY]: "Group name is required.",
  [FAMILY_GROUP_ERROR_CODES.GROUP_NAME_TOO_LONG]:
    "Group name must be 100 characters or fewer.",
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_REQUIRED]:
    "Please select a vehicle to activate group ownership.",
  [FAMILY_GROUP_ERROR_CODES.CUSTOMER_ALREADY_HAS_FAMILY_GROUP]:
    "You already own or belong to another family group. You cannot create a new one.",
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_ALREADY_IN_ANOTHER_GROUP]:
    "This vehicle is already registered under another family group.",
  [FAMILY_GROUP_ERROR_CODES.FAMILY_GROUP_ACCESS_ERROR]:
    "Unable to access this family group.",
  [FAMILY_GROUP_ERROR_CODES.FAMILY_SUBSCRIPTION_EXPIRED_OR_NOT_FOUND]:
    "Your family group hasn't subscribed to a plan, or the plan has expired. Please purchase or renew the Family plan before adding members.",
  [FAMILY_GROUP_ERROR_CODES.FAMILY_GROUP_LIMIT_EXCEEDED]:
    "This family group has reached the maximum number of members allowed by its current plan.",
  [FAMILY_GROUP_ERROR_CODES.CANNOT_INVITE_YOURSELF]:
    "You can't add yourself to your own family group.",
  [FAMILY_GROUP_ERROR_CODES.INVITED_CUSTOMER_NOT_FOUND]:
    "No customer was found with that phone number or email.",
  [FAMILY_GROUP_ERROR_CODES.INVITED_CUSTOMER_ALREADY_IN_ANOTHER_GROUP]:
    "This customer already owns or belongs to another family group.",
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_HAS_ACTIVE_PERSONAL_SUBSCRIPTION]:
    "This vehicle currently has another active personal subscription and can't be added to a family plan.",
  [FAMILY_GROUP_ERROR_CODES.IDENTIFIER_CANNOT_BE_EMPTY]:
    "Please enter a phone number or email to search.",
  [FAMILY_GROUP_ERROR_CODES.CUSTOMER_NOT_FOUND]:
    "Unable to verify your account. Please sign in again.",
  // BE dùng chung "VEHICLE_002" cho cả VEHICLE_NOT_FOUND lẫn VEHICLE_NOT_BELONG_TO_CUSTOMER.
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_INVALID]: "This vehicle is not available for selection.",
  // API-17-02 (Remove Member) / API-17-03 (Dissolve Group) - UNAUTHORIZED_ACTION dùng chung
  // cho cả 2 luồng (không phải owner, hoặc chưa có group nào để thao tác) nên message để
  // chung chung, không chỉ nói riêng về "remove members".
  [FAMILY_GROUP_ERROR_CODES.UNAUTHORIZED_ACTION]:
    "You don't have permission to do this, or you don't currently own a family group.",
  [FAMILY_GROUP_ERROR_CODES.MEMBER_NOT_FOUND]:
    "This member no longer exists in the group.",
  [FAMILY_GROUP_ERROR_CODES.VEHICLE_HAS_ACTIVE_BOOKING]:
    "This member's vehicle has an unfinished booking and can't be removed right now.",
  [FAMILY_GROUP_ERROR_CODES.INVALID_ACTION]:
    "You can't remove yourself as the owner this way. Dissolve the group instead.",
  // API-17-03 (Dissolve Group)
  [FAMILY_GROUP_ERROR_CODES.GROUP_HAS_ACTIVE_BOOKINGS]:
    "This group has members with unfinished bookings. You can't dissolve the group until those bookings are completed or canceled.",
};

export function getFamilyGroupErrorMessage(
  errorCode: string | null | undefined,
  fallbackMessage: string | null | undefined,
): string {
  return (
    (errorCode && FAMILY_GROUP_ERROR_MESSAGES[errorCode]) ??
    fallbackMessage ??
    "Something went wrong. Please try again."
  );
}

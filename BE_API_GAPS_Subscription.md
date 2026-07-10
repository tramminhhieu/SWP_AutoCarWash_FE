# BE API — chỗ cần bổ sung/xác nhận để khớp FE (Subscription / Family)

So sánh API spec Sprint 3 (bạn gửi 2026-07-08) với những gì FE thực tế cần để chạy đúng các
màn hình đã build. Đánh dấu: 🔴 bắt buộc phải có mới chạy đúng, 🟡 nên có (UX tốt hơn), 🔵 cần
BE xác nhận/quyết định (không phải thiếu field, mà là 2 nguồn tài liệu đang mâu thuẫn nhau).

## 1. Admin - Subscription Plan (FE-53)

- 🔴 **`GET /api/admin/subscription-plans`** — response mẫu trong spec không có `id` trong
  từng phần tử, nhưng FE bắt buộc phải có `id` để biết bấm Edit/Delete vào đúng plan nào.
  BE cần trả thêm field `id` cho mỗi item trong `data[]`.
- ✅ **`planType` = `"UNLIMIT"`** — đã confirm trực tiếp với BE ngày 2026-07-08 (không còn là
  câu hỏi mở). FE đã cập nhật lại toàn bộ literal type/so sánh sang `"UNLIMIT"` (trước đó FE
  dùng nhầm `"UNLIMITED"` theo `data.sql` seed cũ). UI vẫn hiển thị chữ "UNLIMITED" cho người
  dùng qua 1 lớp map label riêng - không ảnh hưởng BE.
- 🟡 **`maxVehicleCount` cho UNLIMITED**: response mẫu ghi `null`, nhưng data.sql seed thật
  luôn để `1` (không có dòng nào null). Nên thống nhất 1 trong 2 - FE hiện xử lý được cả
  2 dạng nhưng để tránh nhầm lẫn khi so sánh/hiển thị, nên trả `1` cho khớp data thật.

## 2. Customer - Xem danh sách Subscription Plans (FE-60-US-01)

- 🔴 **`GET /api/customer/subscription-plans`** — cùng vấn đề như trên: response mẫu
  không có `id`, nhưng FE bắt buộc cần `id` để gọi `POST /api/customer/unlimited-
  subscriptions` (body `subscriptionPlanId`) ở bước đăng ký. Không có `id` thì FE không
  biết đăng ký plan nào.

## 3. Customer - Đăng ký Unlimited Subscription (FE-60-US-02.1)

- 🟡 **`GET /api/customer/vehicles`** — spec chỉ trả `{id, licensePlate, vehicleName}`,
  không có cờ báo xe nào đã có gói active. Nếu muốn giữ UX "tự disable xe đã bận gói"
  ngay trên danh sách chọn xe (thay vì để khách chọn xong mới nhận lỗi
  `VEHICLE_ALREADY_SUBSCRIBED`), BE nên trả thêm `hasActiveSubscription: boolean` (hoặc
  tương đương) cho mỗi xe. Không bắt buộc - không có thì FE vẫn chạy đúng, chỉ là bắt lỗi
  muộn hơn 1 bước.
- 🔴 **Cơ chế xác nhận thanh toán QR chưa có** - spec ghi payment info API "tính sau".
  FE cần BE cung cấp 1 trong 2 cách: (a) 1 endpoint polling kiểu
  `GET /api/customer/subscription-invoices/{invoiceId}/status` để FE tự hỏi định kỳ
  invoice đã PAID hay chưa, hoặc (b) webhook + FE nhận qua 1 kênh khác. Không có cái này
  thì màn QR không thể biết khi nào khách thanh toán xong để chuyển bước.
- 🟡 **Payment info response nên có thêm `planName`** (để hiện tên gói trên màn QR cho
  khách biết đang thanh toán cho gói nào) và **`isRenewal: boolean`** (để FE hiện đúng
  câu thông báo "đã kích hoạt" vs "đã gia hạn" sau khi thanh toán xong - dùng chung 1 màn
  QR cho cả đăng ký mới và gia hạn).

## 4. Gia hạn Unlimited Subscription (FE-56-US-02 / US-05)

- 🔴 **Chưa có API nào cho việc gia hạn** - đã hỏi thẳng BE ngày 2026-07-08 và BE xác nhận
  **CHƯA build cả FE-56-US-02 (renew) lẫn FE-56-US-05 (hoàn tất gia hạn/xác nhận thanh toán
  sau renew)** - không chỉ là "chưa thấy trong doc" như các gap khác, mà là chưa triển khai
  thật. FE cần BE định nghĩa tối thiểu 1 endpoint dạng
  `POST /api/customer/unlimited-subscriptions/{id}/renew` trả về
  `{subscriptionId, invoiceId, status}` (giống hệt shape của Register) để FE điều hướng
  sang cùng màn thanh toán QR đang dùng chung cho cả đăng ký mới lẫn gia hạn.
- 🔴 Cần định nghĩa rõ **response lỗi khi gia hạn 1 subscription không còn ACTIVE**
  (EXPIRED/CANCELED) - theo AC03 phải reject, nhưng chưa có errorCode cụ thể nào được
  đặt tên trong spec cho case này.
- FE hiện giữ nguyên mock cho toàn bộ luồng renew (renew/getPaymentInfo/simulatePaymentSuccess
  trong `src/features/subscription/api/subscriptionApi.ts`) cho tới khi có API thật.

## 5. Chuyển đổi phương tiện - Transfer Vehicle (FE-59-US-01)

- 🔴 **Code FE hiện tại đang gọi API CŨ, không khớp spec Sprint 3 mới.**
  - Đang dùng: `POST /api/subscriptions/transfer`, body `{sourceVehicleId, targetVehicleId}`
    (theo tài liệu cũ API-06-01).
  - Spec Sprint 3 định nghĩa lại hoàn toàn khác:
    `GET /api/customer/unlimited-subscriptions/{id}/available-vehicles` (lấy danh sách xe
    được phép chuyển tới) và `PATCH /api/customer/unlimited-subscriptions/{id}/transfer-
    vehicle`, body chỉ `{vehicleId}`.
  - Cần xác nhận: **spec Sprint 3 này có phải bản chuẩn thay thế API-06-01 không?** Nếu
    đúng, FE cần sửa lại `profileApi.ts` (`transferSubscription`) theo endpoint mới, và BE
    cần expose thêm 2 error code `INVALID_VEHICLE` + `VEHICLE_TRANSFER_NOT_ALLOWED` (hiện
    FE đang xử lý lỗi transfer chung chung, chưa map riêng theo code).

## 6. Hủy Subscription (FE-58-US-01)

- ✅ Không thiếu gì - `PATCH /api/customer/unlimited-subscriptions/{id}/cancel` và 3
  errorCode (`SUBSCRIPTION_NOT_FOUND`, `INVALID_SUBSCRIPTION_STATUS`, `ACCESS_DENIED`) đã
  khớp đúng với FE.

## 7. Xem thông tin Unlimited Subscription (FE-60-US-05)

- ✅ Không thiếu gì - response mẫu đã đủ field FE cần hiển thị.

## 8. Family Group Management (ngoài phạm vi Sprint 3 doc này - chưa có ticket/API nào cả)

Route `/subscription/family/:id` (xem/thêm/xóa thành viên, đổi xe liên kết, giải tán nhóm),
xây theo mockup Nora gửi + bảng `family_group`/`family_member` thật trong data.sql, **100%
chưa có bất kỳ API contract chính thức nào từ BE**.

- 🔴 **Cần bộ 5 endpoint** tương ứng 5 thao tác: xem chi tiết nhóm, thêm thành viên, xoá
  thành viên, đổi xe liên kết của 1 thành viên, giải tán nhóm.
- FE đã tự code sẵn phần gọi API theo path/method **tự đoán tạm** (đặt trong
  `API.CUSTOMER.FAMILY_GROUP.*`, `src/constants/apiEndpoints.ts`), cần BE xác nhận hoặc cho
  path/shape thật để đối chiếu lại:
  - `GET /api/customer/family-groups/{subscriptionId}` - xem chi tiết nhóm
  - `POST /api/customer/family-groups/{subscriptionId}/members` - thêm thành viên
  - `DELETE /api/customer/family-groups/{subscriptionId}/members/{memberId}` - xoá thành viên
  - `PATCH /api/customer/family-groups/{subscriptionId}/members/{memberId}/vehicle` - đổi xe
    liên kết của thành viên
  - `DELETE /api/customer/family-groups/{subscriptionId}` - giải tán nhóm
- Request/response shape FE đang dùng (xem
  `src/features/subscription/types/familyGroup.ts`):
  - `FamilyGroupDetail`: `{subscriptionId, groupName, planName, maxVehicleCount, members: FamilyMember[]}`
  - `FamilyMember`: `{id, name, phone, email, isOwner, addedAt, vehicle: {licensePlate, vehicleName} | null, vehicleChangeLockedUntil: string | null}`
  - `AddFamilyMemberRequest`: `{email, licensePlate?, vehicleName?}` - thêm thành viên bằng
    email (BL-AC-19: member phải là customer có sẵn trong hệ thống, chưa thuộc group nào khác)
  - `UpdateMemberVehicleRequest`: `{licensePlate, vehicleName}`
  - errorCode FE đang tự định nghĩa (cần BE xác nhận hoặc thay bằng errorCode thật):
    `GROUP_NOT_FOUND`, `GROUP_FULL`, `MEMBER_NOT_FOUND`, `CANNOT_REMOVE_OWNER`,
    `DUPLICATE_EMAIL`, `VEHICLE_CHANGE_LOCKED`, `MEMBER_NOT_REGISTERED`, `ALREADY_IN_A_GROUP`
- 🔵 BL-AC-23 (FE tự áp dụng, cần BE xác nhận): 1 Family Group tối đa 5 thành viên bất kể
  plan cho phép bao nhiêu xe (`min(5, subscription_plan.max_vehicle_count)`).

# BE API — chỗ cần bổ sung/xác nhận để khớp FE (Subscription / Family)

So sánh API spec Sprint 3 (bạn gửi 2026-07-08) với những gì FE thực tế cần để chạy đúng các
màn hình đã build. Đánh dấu: 🔴 bắt buộc phải có mới chạy đúng, 🟡 nên có (UX tốt hơn), 🔵 cần
BE xác nhận/quyết định (không phải thiếu field, mà là 2 nguồn tài liệu đang mâu thuẫn nhau).

## 1. Admin - Subscription Plan (FE-53)

- 🔴 **`GET /api/admin/subscription-plans`** — response mẫu trong spec không có `id` trong
  từng phần tử, nhưng FE bắt buộc phải có `id` để biết bấm Edit/Delete vào đúng plan nào.
  BE cần trả thêm field `id` cho mỗi item trong `data[]`.
- 🔵 **`planType` = `"UNLIMIT"` hay `"UNLIMITED"`?** Spec Sprint 3 dùng `"UNLIMIT"` xuyên
  suốt mọi request/response mẫu (create/update/detail/list). Nhưng `data.sql` (seed thật)
  chỉ có giá trị `"UNLIMITED"` ở cột `plan_type`. FE hiện đang dùng `"UNLIMITED"` theo
  data.sql. Cần BE xác nhận giá trị enum thật sự BE sẽ lưu/trả về trước khi FE chốt lại,
  đổi sai sẽ làm mọi so sánh planType trong FE bị vỡ.
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

- 🔴 **Chưa có API nào cho việc gia hạn** - cả Note.md gốc lẫn spec Sprint 3 đều để trống
  phần API của 2 ticket này. FE cần BE định nghĩa tối thiểu 1 endpoint dạng
  `POST /api/customer/unlimited-subscriptions/{id}/renew` trả về
  `{subscriptionId, invoiceId, status}` (giống hệt shape của Register) để FE điều hướng
  sang cùng màn thanh toán QR đang dùng chung cho cả đăng ký mới lẫn gia hạn.
- 🔴 Cần định nghĩa rõ **response lỗi khi gia hạn 1 subscription không còn ACTIVE**
  (EXPIRED/CANCELED) - theo AC03 phải reject, nhưng chưa có errorCode cụ thể nào được
  đặt tên trong spec cho case này.

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

## 8. Ngoài phạm vi Sprint 3 doc này (không có ticket/API nào cả)

Family Group Management (route `/subscription/family/:id`, xem/thêm/xóa thành viên, đổi
xe liên kết, giải tán nhóm) hiện 100% mock, xây theo mockup bạn gửi + bảng `family_group`/
`family_member` thật trong data.sql, chưa có bất kỳ API contract nào từ BE. Khi nào cần
làm thật, sẽ cần 1 bộ API riêng (list group, add/remove member, update member vehicle,
dissolve group) - hiện chưa có gì để đối chiếu nên không liệt kê chi tiết ở đây.

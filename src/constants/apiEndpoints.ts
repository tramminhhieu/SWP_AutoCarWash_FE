/**
 * Centralised REST endpoint paths for the AutoCarWash backend.
 * Mọi path ở đây đã bao gồm sẵn tiền tố `/api` → `axiosClient.baseURL` để rỗng (root),
 * KHÔNG set baseURL = "/api" (nếu set sẽ bị lặp thành `/api/api/...`).
 */
export const API = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
  },

  LOCATION: {
    // API-01-01: GET ALL PROVINCES
    PROVINCES: "/api/provinces",
    // API-01-02: GET COMMUNES BY PROVINCE
    COMMUNES_BY_PROVINCE: (provinceId: number | string) =>
      `/api/provinces/${provinceId}/communes`,
    // API-01-03: GET STATIONS BY COMMUNE
    STATIONS_BY_COMMUNE: (communeId: number | string) =>
      `/api/communes/${communeId}/stations`,
    // GET toàn bộ station (id + tên), dùng cho dropdown filter "Chi nhánh" - FE-US-09-04 AC5/AC6
    ALL_STATIONS: "/api/stations",
  },
  BOOKINGS: {
    /** `GET` — list of a customer's upcoming bookings (CONFIRMED/CHECK_IN/WASHING). */
    UPCOMING: "/api/bookings/upcoming",
    /** `GET` — list of a customer's past bookings (PAID/CANCELED/NO_SHOW). */
    PAST: "/api/bookings/past",
    /** `GET` — full detail of a single booking. */
    DETAIL: (bookingId: number | string) => `/api/bookings/${bookingId}`,
    CANCEL: (bookingId: string | number) => `/api/bookings/${bookingId}/cancel`,
  },
  BOOKING: {
    // API-02-01: GET BOOKING CONTEXT
    BOOKING_CONTEXT: (stationId: number | string) =>
      `/api/stations/${stationId}/booking-context`,
    // API-02-02: GET AVAILABLE SLOTS
    BOOKING_SLOTS: (stationId: number | string) =>
      `/api/stations/${stationId}/booking-slots`,
    // API-02-03: CREATE BOOKING
    CREATE_BOOKING: "/api/bookings",
    // API-02-04: PREVIEW BOOKING PRICE
    PREVIEW_PRICE: "/api/bookings/preview-price",
  },
  VEHICLE: {
    ADD: "/api/vehicles",
    DELETE: (vehicleId: number | string) => `/api/vehicles/${vehicleId}`,
    UPDATE: (vehicleId: number | string) => `/api/vehicles/${vehicleId}`,
  },
  CUSTOMER: {
    // API-05-02: GET CUSTOMER PROFILE
    PROFILE: "/api/customers/profile",
    // API-05-01: UPDATE PROFILE
    UPDATE_PROFILE: "/api/customers/profile",
    // API-05-03: CHANGE PASSWORD — endpoint nằm trong namespace /auth, KHÔNG phải /customers
    CHANGE_PASSWORD: "/api/auth/change-password",
    // API-06-01:: TRANSFER SUBSCRIPTION PLAN
    TRANSFER_SUBSCRIPTION: "/api/subscriptions/transfer",
  },
  PAYMENTS: {
    CASH: "/api/payments/cash",
    // GET admin/staff-wide transaction list + KPI summary (?method=&status=&type=&fromDate=&toDate=&bookingId=&transactionId=&stationId=)
    TRANSACTIONS: "/api/payments/transactions",
    // GET invoice detail after payment (FE-63-US-01 AC02)
    INVOICE_DETAIL: (invoiceId: number | string) =>
      `/api/payments/invoices/${invoiceId}`,
    // GET payment history for the logged-in customer (?type=&fromDate=&toDate=)
    HISTORY: "/api/payments/history",
  },
  SUBSCRIPTIONS: {
    // GET the customer's currently active subscription (204 if none)
    ACTIVE: "/api/subscriptions/active",
  },
  CUSTOMERS: {
    // GET admin customer list + KPI summary (?page=&size=&keyword=) - FE-US-09
    LIST: "/api/customers",
    // GET customer detail / DELETE customer (admin only) - FE-US-09-03
    DETAIL: (customerId: number | string) => `/api/customers/${customerId}`,
    // GET lịch sử booking của 1 khách hàng (admin only) - FE-US-09-04
    // (?page=&size=&vehicleKeyword=&serviceCategoryId=&active=&stationId=)
    BOOKINGS: (customerId: number | string) =>
      `/api/customers/${customerId}/bookings`,
  },
  LOYALTY: {
    // GET loyalty profile (points, tier, spending)
    PROFILE: "/api/loyalty/profile",
    // GET loyalty history (?year=&month=)
    HISTORY: "/api/loyalty/history",
    // GET tier catalog
    TIERS: "/api/loyalty/tiers",
    // GET tier change history (upgrade/downgrade log)
    TIER_HISTORY: "/api/loyalty/tier-history",
  },
  ADDON: {
    LIST: "/api/addon-services",
  },
  SERVICE_PACKAGE: {
    LIST: "/api/service-packages",
  },
  WASHLANE: {
    // GET /api/admin/stations/{stationId}/lanes — danh sách wash lane theo station (Admin)
    LIST_BY_STATION: (stationId: number | string) =>
      `/api/admin/stations/${stationId}/lanes`,
  },
  PROMOTION: {
    // API-02-01: Tổng hợp số lượng promotion theo từng chi nhánh
    BRANCHES_SUMMARY: "/api/admin/promotions/branches-summary",

    // API-02-02: Danh sách promotion/voucher phân trang (hỗn hợp CAMPAIGN + STANDALONE_VOUCHER)
    DASHBOARD_LIST: "/api/admin/promotions",

    CREATE: "/api/admin/promotions/config",

    UPDATE_CAMPAIGN: "/api/admin/promotions", // + /{promotionId} append trong hàm
    UPDATE_VOUCHER: "/api/admin/promotions/vouchers", // + /{voucherId} append trong hàm

    SOFT_DELETE_CAMPAIGN: "/api/admin/promotions", // + /{promotionId}/soft-delete
    SOFT_DELETE_VOUCHER: "/api/admin/vouchers", // + /{voucherId}/soft-delete
  },
  SETTINGS: {
    LIST: "/api/admin/system-settings",
    CREATE: "/api/admin/system-settings",
    UPDATE: (id: number) => `/api/admin/system-settings/${id}`,
  },
};

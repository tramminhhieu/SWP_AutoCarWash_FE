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
    SUBSCRIPTION_PLAN: {
      // FE-60-US-01: GET /api/customer/subscription-plans
      LIST: "/api/customer/subscription-plans",
    },
    UNLIMITED_SUBSCRIPTION: {
      // FE-60-US-05: GET /api/customer/unlimited-subscriptions
      LIST: "/api/customer/unlimited-subscriptions",
      // FE-58-US-01: PATCH /api/customer/unlimited-subscriptions/{id}/cancel
      CANCEL: (id: number | string) =>
        `/api/customer/unlimited-subscriptions/${id}/cancel`,
    },
    // FE-US-56-04: mua/gia hạn gói Unlimited CÓ thanh toán QR thật (tách khỏi
    // UNLIMITED_SUBSCRIPTION ở trên - đăng ký cũ không QR đã bị thay thế).
    SUBSCRIPTION_PURCHASE: {
      REGISTER: "/api/customer/subscriptions/unlimited",
      RENEW: (subscriptionId: number | string) =>
        `/api/customer/subscriptions/unlimited/${subscriptionId}/renew`,
      INVOICE_STATUS: (invoiceId: number | string) =>
        `/api/subscriptions/invoices/${invoiceId}`,
    },
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
  SERVICE_PACKAGE: {
    // API-05-01: GET /api/service-packages
    LIST: "/api/service-packages",
  },
  ADDON_SERVICE: {
    // GET /api/addon-services - public, dùng để resolve tên add-on cho ServicePackage.addons
    LIST: "/api/addon-services",
  },
  ADMIN: {
    SERVICE_PACKAGE: {
      // GET /api/admin/service-packages/active - dropdown Service Package trong form Create/Edit Subscription Plan
      ACTIVE: "/api/admin/service-packages/active",
    },
    SUBSCRIPTION_PLAN: {
      // FE-53-US-01: GET /api/admin/subscription-plans?status=ACTIVE/INACTIVE/ALL
      LIST: "/api/admin/subscription-plans",
      // FE-53-US-03: GET /api/admin/subscription-plans/{id}
      DETAIL: (id: number | string) => `/api/admin/subscription-plans/${id}`,
      // FE-53-US-02: POST /api/admin/subscription-plans
      CREATE: "/api/admin/subscription-plans",
      // FE-53-US-03: PUT /api/admin/subscription-plans/{id}
      UPDATE: (id: number | string) => `/api/admin/subscription-plans/${id}`,
      // FE-53-US-04: DELETE /api/admin/subscription-plans/{id} (soft delete -> INACTIVE)
      DELETE: (id: number | string) => `/api/admin/subscription-plans/${id}`,
    },
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
};

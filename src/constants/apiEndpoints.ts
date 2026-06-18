// Object chứa toàn bộ URL endpoint, nhóm theo module (theo đúng API.txt)
export const API = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/auth/register",
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
};

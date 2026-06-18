// Object chứa toàn bộ URL endpoint, nhóm theo module (theo đúng API.txt)
export const API = {
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
};

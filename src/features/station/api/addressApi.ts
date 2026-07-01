import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { ApiSuccessResponse } from "../../../types/apiResponse";
import type { Province, Commune } from "../types/address";

// API-01-01: GET ALL PROVINCES
export const getProvinces = async (): Promise<Province[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<Province[]>>(
    API.LOCATION.PROVINCES,
  );
  return res.data.data;
};

// API-01-02: GET COMMUNES BY PROVINCE
export const getCommunesByProvince = async (
  provinceId: number,
): Promise<Commune[]> => {
  const res = await axiosClient.get<ApiSuccessResponse<Commune[]>>(
    API.LOCATION.COMMUNES_BY_PROVINCE(provinceId),
  );
  return res.data.data;
};

// import type { Province, Commune } from "../types/address";
// import { MOCK_PROVINCES, MOCK_COMMUNES } from "../../../mocks/locationMockData";

// // ⚠️ MOCK: giả lập độ trễ mạng để UI loading hiển thị thật hơn
// const MOCK_DELAY_MS = 400;
// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// // API-01-01: GET ALL PROVINCES
// // MOCK: trả về data tĩnh, không gọi BE thật (mockapi.io không hỗ trợ route lồng nhau)
// export const getProvinces = async (): Promise<Province[]> => {
//   await delay(MOCK_DELAY_MS);
//   return MOCK_PROVINCES;
// };

// // API-01-02: GET COMMUNES BY PROVINCE
// // MOCK: lọc theo provinceId trong data tĩnh
// export const getCommunesByProvince = async (
//   provinceId: number,
// ): Promise<Commune[]> => {
//   await delay(MOCK_DELAY_MS);
//   return MOCK_COMMUNES.filter((c) => c.provinceId === provinceId);
// };

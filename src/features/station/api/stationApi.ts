// import axiosClient from "../../../lib/axiosClient";
// import { API } from "../../../constants/apiEndpoints";
// import type { ApiSuccessResponse } from "../../../types/apiResponse";
// import type { Station } from "../types/station";

// // API-01-03: GET STATIONS BY COMMUNE
// export const getStationsByCommune = async (
//   communeId: number,
// ): Promise<Station[]> => {
//   const res = await axiosClient.get<ApiSuccessResponse<Station[]>>(
//     API.LOCATION.STATIONS_BY_COMMUNE(communeId),
//   );
//   return res.data.data;
// };

import type { Station } from "../types/station";
import { MOCK_STATIONS } from "../../../mocks/locationMockData";

// ⚠️ MOCK: giả lập độ trễ mạng để UI loading hiển thị thật hơn
const MOCK_DELAY_MS = 400;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// API-01-03: GET STATIONS BY COMMUNE
// MOCK: trả về data tĩnh cho 1 vài commune mẫu (id 31, 32, 11), còn lại trả mảng rỗng
export const getStationsByCommune = async (
  communeId: number,
): Promise<Station[]> => {
  await delay(MOCK_DELAY_MS);

  // Mock đơn giản: gán cứng stationId nào thuộc commune nào để demo UI
  const communeToStationIds: Record<number, number[]> = {
    31: [101, 102], // Hai Chau
    32: [103], // Thanh Khe
    11: [104], // Binh Thanh
  };

  const stationIds = communeToStationIds[communeId] ?? [];
  return MOCK_STATIONS.filter((s) => stationIds.includes(s.id));
};

import type { Province, Commune } from "../features/station/types/address";
import type { Station } from "../features/station/types/station";

// ⚠️ MOCK DATA - dùng tạm khi chưa có BE thật / mockapi.io không hỗ trợ route lồng nhau.
// Khi có BE thật, xóa file này và sửa lại addressApi.ts, stationApi.ts để gọi axiosClient
// như code gốc (đã comment lại bên dưới mỗi file).

export const MOCK_PROVINCES: Province[] = [
  { id: 1, provinceName: "Ho Chi Minh City" },
  { id: 2, provinceName: "Hanoi" },
  { id: 3, provinceName: "Da Nang" },
  { id: 4, provinceName: "Can Tho" },
  { id: 5, provinceName: "Hai Phong" },
];

export const MOCK_COMMUNES: Commune[] = [
  // Communes của Da Nang (id: 3) - khớp mockup
  { id: 31, communeName: "Hai Chau", provinceId: 3 },
  { id: 32, communeName: "Thanh Khe", provinceId: 3 },
  { id: 33, communeName: "Son Tra", provinceId: 3 },
  { id: 34, communeName: "Ngu Hanh Son", provinceId: 3 },

  // Communes của Ho Chi Minh City (id: 1)
  { id: 11, communeName: "Binh Thanh", provinceId: 1 },
  { id: 12, communeName: "Quan 1", provinceId: 1 },
  { id: 13, communeName: "Thu Duc", provinceId: 1 },

  // Communes của Hanoi (id: 2)
  { id: 21, communeName: "Hoan Kiem", provinceId: 2 },
  { id: 22, communeName: "Cau Giay", provinceId: 2 },
];

export const MOCK_STATIONS: Station[] = [
  // Stations của Hai Chau (id: 31) - khớp mockup
  {
    id: 101,
    stationName: "Binh Thanh Primary Hub",
    address: "Main Road, Hai Chau",
    isOperating: true,
  },
  {
    id: 102,
    stationName: "Elite Auto Hai Chau",
    address: "Secondary Road, Hai Chau",
    isOperating: true,
  },

  // Stations của Thanh Khe (id: 32)
  {
    id: 103,
    stationName: "Thanh Khe Wash Center",
    address: "12 Dien Bien Phu, Thanh Khe",
    isOperating: false,
  },

  // Stations của Binh Thanh (id: 11)
  {
    id: 104,
    stationName: "Binh Thanh Detailing Hub",
    address: "456 Dien Bien Phu, Binh Thanh",
    isOperating: true,
  },
];

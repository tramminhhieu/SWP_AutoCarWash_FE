// Placeholder cho tới khi BE có endpoint "list all stations" phẳng (hiện tại
// station chỉ fetch được scoped theo commune, xem src/features/station/api/stationApi.ts).
// Dùng để populate filter "Branch" ở tab Single Wash.
// LƯU Ý: stationId filter bên BE (GET /api/payments/transactions) đã hoạt động
// thật (join tới bs.station.id), nhưng id ở đây CHỈ LÀ ID GIẢ - không khớp với
// station thật trong DB nên filter sẽ trả về rỗng cho tới khi thay bằng id thật
// (hoặc BE bổ sung endpoint list-all-stations để FE tự fetch).
export interface MockStation {
  id: number;
  name: string;
}

export const MOCK_STATIONS: MockStation[] = [
  { id: 1, name: "HydroLux Quận 1" },
  { id: 2, name: "HydroLux Quận 7" },
  { id: 3, name: "HydroLux Thủ Đức" },
];

import type { ServicePackage } from "../types/servicePackage";

// Mock data tạm thời để test UI - đúng field/giá trị theo API-05-01 (GET /api/service-packages),
// addons cộng dồn theo tier: Basic 3 cái, Medium = 3 cái của Basic + 2 cái mới (5), Premium = 5 cái của Medium + 2 cái mới (7).
// Khi BE có thật, thay nội dung hàm getAll() bằng axiosClient.get("/api/service-packages")
// và giữ nguyên type ServicePackage để không phải sửa lại phần UI đang dùng.
const MOCK_SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 1,
    name: "Basic",
    description:
      "Essential maintenance wash including exterior foam wash, wheel cleaning and hand dry.",
    basePrice: 149000,
    durationMinutes: 15,
    addons: ["Exterior Foam Wash", "Wheel Cleaning", "Hand Dry"],
  },
  {
    id: 2,
    name: "Medium",
    description:
      "Complete inside-out refresh, includes everything in Basic plus interior vacuum and window cleaning.",
    basePrice: 299000,
    durationMinutes: 30,
    addons: [
      "Exterior Foam Wash",
      "Wheel Cleaning",
      "Hand Dry",
      "Interior Vacuum",
      "Window Cleaning",
    ],
  },
  {
    id: 3,
    name: "Premium",
    description:
      "Ultimate detail and protection, includes everything in Medium plus ceramic boost spray and dashboard UV protection.",
    basePrice: 499000,
    durationMinutes: 45,
    addons: [
      "Exterior Foam Wash",
      "Wheel Cleaning",
      "Hand Dry",
      "Interior Vacuum",
      "Window Cleaning",
      "Ceramic Boost Spray",
      "Dashboard UV Protection",
    ],
  },
];

/** Lấy toàn bộ gói dịch vụ đang active - dùng cho cả ServicePackageList và section Home. */
export function getAll(): Promise<ServicePackage[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_SERVICE_PACKAGES), 500);
  });
}

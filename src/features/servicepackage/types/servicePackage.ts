// GET /api/service-packages
export interface ServicePackage {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  durationMinutes: number;
  addons: string[];
  // Optional vì trang customer (ServicePackageList) không cần field này - chỉ dùng để
  // lọc ACTIVE cho dropdown ở form Subscription Plan (FE-53-US-02 AC02)
  status?: "ACTIVE" | "INACTIVE";
}

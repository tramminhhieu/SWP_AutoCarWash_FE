// GET /api/service-packages
export interface ServicePackage {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  durationMinutes: number;
  addons: string[];
}

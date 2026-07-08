import type {
  AddonService,
  CreateAddonServiceRequest,
  ServiceCategoryOption,
} from "../types/addonService";

// ⚠️ MOCK DATA - chưa có endpoint /api/admin/addon-services (Note.md không có spec cho Add-on).
// service_category lấy đúng 3 dòng thật trong data.sql.
const SERVICE_CATEGORIES: ServiceCategoryOption[] = [
  { id: 1, name: "Single Wash" },
  { id: 2, name: "Family" },
  { id: 3, name: "Unlimited" },
];

interface MockAddon {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  serviceCategoryId: number;
  status: "ACTIVE" | "INACTIVE";
}

// 1 vài dòng mẫu lấy theo data.sql thật (addon_service, service_category_id = 1 "Single Wash")
let mockAddons: MockAddon[] = [
  {
    id: 1,
    name: "Exterior Foam Wash",
    price: 60000,
    durationMinutes: 15,
    serviceCategoryId: 1,
    status: "ACTIVE",
  },
  {
    id: 6,
    name: "Ceramic Boost Spray",
    price: 150000,
    durationMinutes: 15,
    serviceCategoryId: 1,
    status: "ACTIVE",
  },
];

let nextId = 100;

const delay = <T,>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const categoryName = (id: number): string =>
  SERVICE_CATEGORIES.find((c) => c.id === id)?.name ?? "Unknown Category";

const toAddonService = (a: MockAddon): AddonService => ({
  id: a.id,
  name: a.name,
  price: a.price,
  durationMinutes: a.durationMinutes,
  serviceCategoryId: a.serviceCategoryId,
  serviceCategoryName: categoryName(a.serviceCategoryId),
  status: a.status,
});

export const getServiceCategoryOptions = (): Promise<ServiceCategoryOption[]> =>
  delay(SERVICE_CATEGORIES);

export const getAll = (): Promise<AddonService[]> => delay(mockAddons.map(toAddonService));

export const create = (
  data: CreateAddonServiceRequest,
): Promise<{ success: true; message: string; data: unknown }> => {
  const newAddon: MockAddon = { id: nextId++, ...data, status: "ACTIVE" };
  mockAddons = [...mockAddons, newAddon];
  return delay({
    success: true,
    message: "Add-on service created successfully.",
    data: {},
  });
};

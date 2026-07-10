// Mirrors backend `customer/dto/response/CustomerListItemResponse.java` +
// `CustomerSummaryResponse.java` + `CustomerListPageResponse.java`, returned by
// GET /api/customers (admin only, FE-US-09).
export interface AdminCustomerRow {
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  active: boolean;
  tier: string | null; // null khi khách chưa được gán tier
  lastVisit: string; // "yyyy-MM-dd'T'HH:mm:ss"
}

export interface CustomerKpiSummary {
  totalCustomers: number;
  newThisMonth: number;
  goldMembers: number;
}

// Mirrors backend `customer/dto/response/CustomerDetailResponse.java`, returned by
// GET /api/customers/{customerId} (admin only, FE-US-09-03).
export interface AdminCustomerVehicle {
  brandName: string;
  color: string;
  licensePlate: string;
  activeSubscriptionType: string | null; // "UNLIMITED" | "FAMILY" | null
}

export interface AdminCustomerDetail {
  customerId: number;
  customerCode: string;
  fullName: string;
  email: string;
  phone: string;
  tier: string | null;
  totalPoints: number;
  lastVisit: string | null;
  accountStatus: "ACTIVE" | "INACTIVE";
  vehicles: AdminCustomerVehicle[];
}

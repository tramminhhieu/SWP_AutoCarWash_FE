// Types cho Loyalty feature — xem AutoWash API.postman_collection.json (folder "Loyalty")

export interface LoyaltyProfile {
  totalPoints: number;
  accumulatedPoints: number;
  upcomingResetDate: string;
  daysUntilReset: number;
  tierName: string;
  nextTierName: string | null;
  pointsToNextTier: number | null;
  currentTotalSpending: number;
  retentionTargetAmount: number;
  retentionCurrentAmount: number;
  retentionEndDate: string;
  retentionStatus: string;
}

export interface LoyaltyTier {
  tierName: string;
  minPoints: number;
  bookingWindowDays: number;
  pointMultiple: number;
  retentionTargetAmount: number;
  benefits: string[];
}

export interface LoyaltyTransaction {
  createdAt: string;
  servicePackageName: string;
  points: number;
  bookingId: number | null;
}

export interface LoyaltyHistory {
  year: number;
  month: number | null;
  totalSpending: number;
  transactions: LoyaltyTransaction[];
}

export interface TierHistoryEntry {
  id: number;
  oldTierName: string | null;
  newTierName: string;
  valueAtTransition: number;
  changeType: "UPGRADE" | "DOWNGRADE" | "INITIAL";
  createdAt: string;
  bookingId: number | null;
}

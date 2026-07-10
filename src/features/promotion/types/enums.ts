// Loại chương trình khuyến mãi: chiến dịch campaign hoặc voucher lẻ toàn hệ thống
export type PromotionType = "CAMPAIGN" | "STANDALONE_VOUCHER";

// Trạng thái vòng đời của một promotion
export type PromotionStatus = "ACTIVE" | "UPCOMING" | "INACTIVE";

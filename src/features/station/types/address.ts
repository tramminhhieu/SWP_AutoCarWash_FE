// Khớp với bảng province trong DB.txt + response API-01-01
export interface Province {
  id: number;
  provinceName: string;
}

// Khớp với bảng commune trong DB.txt + response API-01-02
export interface Commune {
  id: number;
  communeName: string;
  provinceId: number;
}

// Khớp với bảng station trong DB.txt + response API-01-03
export interface Station {
  id: number;
  stationName: string;
  address: string;
  operating: boolean;
}

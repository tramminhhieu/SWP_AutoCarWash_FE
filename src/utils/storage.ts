// Gói localStorage lại thành hàm dùng chung
const ACCESS_TOKEN_KEY = "hydro_lux_access_token";
const REFRESH_TOKEN_KEY = "hydro_lux_refresh_token";
const USER_NAME_KEY = "hydro_lux_user_name";
const STATION_ID_KEY = "hydro_lux_station_id";

export const getToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getUserName = (): string | null =>
  localStorage.getItem(USER_NAME_KEY);

export const setUserName = (name: string): void =>
  localStorage.setItem(USER_NAME_KEY, name);

export const getStationId = (): number | null => {
  const raw = localStorage.getItem(STATION_ID_KEY);
  return raw ? Number(raw) : null;
};

export const setStationId = (stationId: number): void =>
  localStorage.setItem(STATION_ID_KEY, String(stationId));

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(STATION_ID_KEY);
};

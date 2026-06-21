import type { LoginRequest, LoginResponse } from "../types/auth";
import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { RegisterRequest } from "../types/auth";

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const res = await axiosClient.post<{
    success: boolean;
    message: string;
    data: { token: string; email: string; name: string };
  }>(API.AUTH.LOGIN, payload);
  return {
    token: res.data.data.token,
    message: res.data.message,
    name: res.data.data.name,
  };
};

export const register = async (
  payload: RegisterRequest,
): Promise<{ message: string }> => {
  const response = await axiosClient.post(API.AUTH.REGISTER, payload);
  return response.data; // { success, message }
};

import type { LoginRequest, LoginResponse } from "../types/auth";
import { mockLogin } from "../../../mocks/auth";
import axiosClient from "../../../lib/axiosClient";
import type { RegisterRequest } from "../types/auth";

// MOCK: dùng tạm để test login khi chưa muốn gọi BE thật.
// Tài khoản test: admin@gmail.com / 123456
export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  console.log(payload);
  return mockLogin(payload);
};

import { API } from "../../../constants/apiEndpoints";

export const register = async (
  payload: RegisterRequest,
): Promise<{ message: string }> => {
  const response = await axiosClient.post(API.AUTH.REGISTER, payload);
  return response.data;
};

/* ====== CODE GỐC (gọi BE thật qua axiosClient) - bỏ comment khi cần gọi BE thật ======

import axiosClient from "../../../lib/axiosClient";
import { API } from "../../../constants/apiEndpoints";
import type { RegisterRequest } from "../types/auth";

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const res = await axiosClient.post<LoginResponse>(API.AUTH.LOGIN, payload);
  return res.data;
};

export const register = async (
  payload: RegisterRequest
): Promise<{ message: string }> => {
  const response = await axiosClient.post(API.AUTH.REGISTER, payload);
  return response.data; // { success, message }
};

========================================================================================= */
